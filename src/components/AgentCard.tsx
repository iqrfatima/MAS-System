import React from 'react';
import { Agent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, MessageSquare, Brain, Activity } from 'lucide-react';

interface Props {
  agent: Agent;
}

export const AgentCard: React.FC<Props> = ({ agent }) => {
  const getStatusColor = () => {
    switch (agent.status) {
      case 'thinking': return 'bg-amber-500';
      case 'working': return 'bg-blue-500';
      case 'reviewing': return 'bg-emerald-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <motion.div 
      layout
      className="bg-white p-4 rounded-xl border border-black/5 shadow-sm flex flex-col gap-3 relative overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img 
            src={agent.avatar} 
            alt={agent.name} 
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor()}`}>
            {agent.status !== 'idle' && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-full h-full rounded-full bg-white/30"
              />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{agent.name}</h3>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{agent.role}</p>
        </div>
      </div>

      <p className="text-xs text-slate-600 line-clamp-2 italic">"{agent.bio}"</p>

      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
          <Activity size={10} />
          {agent.status.toUpperCase()}
        </div>
      </div>

      <AnimatePresence>
        {agent.status === 'thinking' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-amber-500/5 flex items-center justify-center pointer-events-none"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Brain className="text-amber-500 opacity-20" size={64} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
