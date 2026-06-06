import React from 'react';
import { Message, Agent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Brain, Terminal, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  messages: Message[];
  agents: Agent[];
}

export const ActivityLog: React.FC<Props> = ({ messages, agents }) => {
  const getAgent = (id: string) => agents.find(a => a.id === id);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Team Communication</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Live Feed</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const agent = getAgent(msg.senderId);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3"
              >
                {agent ? (
                  <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full flex-shrink-0 border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Info size={14} className="text-slate-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{agent?.name || 'System'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {msg.type === 'thought' && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-bold uppercase tracking-wider">
                        <Brain size={10} /> Thought
                      </span>
                    )}
                  </div>
                  
                  <div className={`text-sm p-3 rounded-lg border ${
                    msg.type === 'thought' 
                      ? 'bg-amber-500/5 border-amber-500/20 text-amber-100/80 italic' 
                      : msg.type === 'system'
                      ? 'bg-blue-500/5 border-blue-500/20 text-blue-200'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
