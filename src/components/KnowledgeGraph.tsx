import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { KnowledgeGraph as GraphType, GraphNode, GraphLink } from '../types';

interface Props {
  graph: GraphType;
}

export const KnowledgeGraph: React.FC<Props> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation<GraphNode & d3.SimulationNodeDatum>(graph.nodes as any)
      .force("link", d3.forceLink<GraphNode & d3.SimulationNodeDatum, GraphLink & d3.SimulationLinkDatum<any>>(graph.links as any).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graph.links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(graph.nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 8)
      .attr("fill", d => {
        switch (d.type) {
          case 'decision': return '#ef4444';
          case 'component': return '#3b82f6';
          case 'requirement': return '#10b981';
          case 'dependency': return '#f59e0b';
          default: return '#9ca3af';
        }
      });

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(d => d.label)
      .attr("stroke", "none")
      .attr("fill", "#333")
      .attr("font-size", "10px")
      .attr("font-family", "sans-serif");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graph]);

  return (
    <div className="w-full h-full bg-white rounded-xl border border-black/5 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold opacity-60">
          <div className="w-2 h-2 rounded-full bg-red-500"></div> Decision
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold opacity-60">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div> Component
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold opacity-60">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Requirement
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold opacity-60">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div> Dependency
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
