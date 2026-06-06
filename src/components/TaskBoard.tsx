import React from 'react';
import { Task, Agent } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

interface Props {
  tasks: Task[];
  agents: Agent[];
}

export const TaskBoard: React.FC<Props> = ({ tasks, agents }) => {
  const getAgent = (id?: string) => agents.find(a => a.id === id);

  const columns = [
    { id: 'todo', label: 'Backlog', icon: Circle, color: 'text-slate-400' },
    { id: 'in-progress', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
    { id: 'review', label: 'Review', icon: AlertCircle, color: 'text-amber-500' },
    { id: 'done', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
      {columns.map((col) => (
        <div key={col.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <col.icon size={14} className={col.color} />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{col.label}</h3>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </div>

          <div className="flex-1 bg-slate-50/50 rounded-xl p-2 space-y-2 border border-slate-100 overflow-y-auto min-h-[200px]">
            {tasks.filter(t => t.status === col.id).map((task) => {
              const agent = getAgent(task.assignedTo);
              return (
                <motion.div
                  layout
                  key={task.id}
                  className="bg-white p-3 rounded-lg border border-black/5 shadow-sm space-y-2"
                >
                  <h4 className="text-xs font-semibold text-slate-900 leading-tight">{task.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex -space-x-1">
                      {task.dependencies.length > 0 && (
                        <div className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {task.dependencies.length} DEP
                        </div>
                      )}
                    </div>
                    {agent && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{agent.name}</span>
                        <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full border border-white shadow-sm" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
