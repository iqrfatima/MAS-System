import { createChat } from "./gemini";
import { SYSTEM_INSTRUCTIONS, AGENTS } from "../constants";
import { Message, Task, ProjectState, GraphNode, GraphLink } from "../types";
import { Type } from "@google/genai";

class AgentManager {
  private sessions: Map<string, any> = new Map();

  constructor() {
    this.initializeSessions();
  }

  private initializeSessions() {
    AGENTS.forEach(agent => {
      const chat = createChat(SYSTEM_INSTRUCTIONS[agent.role]);
      this.sessions.set(agent.id, chat);
    });
  }

  async processTask(
    agentId: string,
    task: Task,
    state: ProjectState
  ): Promise<{
    output: string;
    messages: Message[];
    nodes: GraphNode[];
    links: GraphLink[];
  }> {
    const session = this.sessions.get(agentId);
    if (!session) throw new Error(`No session for agent ${agentId}`);

    const context = `
      Current Project Goal: ${state.goal}
      Your Task: ${task.title} - ${task.description}
      Target Filename: ${task.filename || 'N/A'}
      
      Shared Knowledge Graph (Current State):
      ${JSON.stringify(state.graph.nodes)}
      
      Recent Team Communication:
      ${state.messages.slice(-10).map(m => `[${m.type}] ${m.senderId}: ${m.content}`).join('\n')}
      
      INSTRUCTIONS:
      1. This is a stateful conversation. You have memory of your previous turns.
      2. Perform your assigned task autonomously.
      3. If you need to communicate with another agent, use the "communication" field.
      4. Provide your output in a JSON format matching this schema:
      {
        "output": "The final technical result of your work",
        "thought": "Your internal reasoning about this step, reflecting on your previous memory",
        "communication": "A message to the team about what you did",
        "graphUpdates": {
          "nodes": [{"id": "unique-id", "label": "label", "type": "decision|component|requirement|dependency"}],
          "links": [{"source": "id1", "target": "id2", "label": "relationship"}]
        }
      }
      Respond ONLY with the JSON block.
    `;

    const response = await session.sendMessage({ message: context });
    const text = response.text || "{}";
    
    // Clean up potential markdown formatting
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    let result: any;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse agent response as JSON:", text);
      // Fallback if JSON parsing fails
      result = {
        output: text,
        thought: "I encountered an error parsing my structured output, but I have completed the task.",
        communication: "Task completed, but I had trouble formatting the metadata.",
        graphUpdates: { nodes: [], links: [] }
      };
    }
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    await delay(12000); // 12 sec gap → ~5 requests/min safe

    const messages: Message[] = [
      {
        id: Math.random().toString(36).substr(2, 9),
        senderId: agentId,
        content: result.thought,
        timestamp: Date.now(),
        type: 'thought'
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        senderId: agentId,
        content: result.communication,
        timestamp: Date.now(),
        type: 'communication'
      }
    ];

    const nodes: GraphNode[] = (result.graphUpdates?.nodes || []).map((n: any) => ({
      ...n,
      agentId
    }));

    const links: GraphLink[] = result.graphUpdates?.links || [];

    return {
      output: result.output,
      messages,
      nodes,
      links
    };
  }

  reset() {
    this.sessions.clear();
    this.initializeSessions();
  }
}

export const agentManager = new AgentManager();
