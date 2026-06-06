import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  LayoutDashboard, 
  Network, 
  MessageSquare, 
  Settings,
  Sparkles,
  Terminal,
  Users,
  Download
} from 'lucide-react';
import { ProjectState, Task, Message, Agent } from './types';
import { AGENTS } from './constants';
import { planProject, agentStep } from './services/orchestrator';
import { agentManager } from './services/agentManager';
import { AgentCard } from './components/AgentCard';
import { ActivityLog } from './components/ActivityLog';
import { TaskBoard } from './components/TaskBoard';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { FileExplorer, downloadAllFiles } from './components/FileExplorer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [state, setState] = useState<ProjectState>({
    goal: '',
    tasks: [],
    messages: [],
    graph: { nodes: [], links: [] },
    agents: AGENTS,
  });

  const [inputGoal, setInputGoal] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'graph' | 'tasks' | 'files'>('dashboard');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          ...msg,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
        }
      ]
    }));
  }, []);

  const handleStartProject = async () => {
    if (!inputGoal.trim()) return;
    
    setIsPlanning(true);
    setState(prev => ({ ...prev, goal: inputGoal, tasks: [], messages: [], graph: { nodes: [], links: [] } }));
    
    try {
      addMessage({ senderId: 'system', content: `Starting project: **${inputGoal}**`, type: 'system' });
      addMessage({ senderId: 'system', content: 'Orchestrator is planning the project structure...', type: 'system' });
      
      const tasks = await planProject(inputGoal);
      setState(prev => ({ ...prev, tasks }));
      addMessage({ senderId: 'system', content: `Project plan generated with ${tasks.length} tasks.`, type: 'system' });
      setIsRunning(true);
    } catch (error) {
      console.error(error);
      addMessage({ senderId: 'system', content: 'Failed to plan project. Please check your API key.', type: 'system' });
    } finally {
      setIsPlanning(false);
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const runNextSteps = async () => {
      // Find all tasks that are 'todo' and have all dependencies 'done'
      const availableTasks = state.tasks.filter(t => 
        t.status === 'todo' && 
        t.dependencies.every(depId => state.tasks.find(pt => pt.id === depId)?.status === 'done')
      );

      if (availableTasks.length === 0) {
        if (state.tasks.length > 0 && state.tasks.every(t => t.status === 'done')) {
          setIsRunning(false);
          addMessage({ senderId: 'system', content: 'Project completed successfully! Preparing your files for download...', type: 'system' });
          // Trigger automatic download
          setTimeout(() => {
            downloadAllFiles(state.tasks, state.goal || 'forge-project');
          }, 1500);
        }
        return;
      }

      // Filter tasks where the assigned agent is currently idle
      const tasksToStart = availableTasks.filter(task => {
        const agent = state.agents.find(a => a.id === task.assignedTo);
        return agent && agent.status === 'idle';
      });

      if (tasksToStart.length === 0) return;

      // Start all available tasks in parallel
      tasksToStart.forEach(async (task) => {
        const agentId = task.assignedTo;
        if (!agentId) return;

        // Update agent and task status immediately (optimistic update)
        setState(prev => ({
          ...prev,
          agents: prev.agents.map(a => a.id === agentId ? { ...a, status: 'thinking' } : a),
          tasks: prev.tasks.map(t => t.id === task.id ? { ...t, status: 'in-progress' } : t)
        }));

        try {
          const result = await agentStep(agentId, task, state);
          
          setState(prev => ({
            ...prev,
            agents: prev.agents.map(a => a.id === agentId ? { ...a, status: 'idle' } : a),
            tasks: prev.tasks.map(t => t.id === task.id ? { ...t, status: 'done', output: result.output } : t),
            messages: [...prev.messages, ...result.messages],
            graph: {
              nodes: [...prev.graph.nodes, ...result.nodes],
              links: [...prev.graph.links, ...result.links]
            }
          }));
        } catch (error) {
          console.error(error);
          setIsRunning(false);
          addMessage({ senderId: 'system', content: `Error during task execution by agent ${agentId}`, type: 'system' });
        }
      });
    };

    const timer = setTimeout(runNextSteps, 2000);
    return () => clearTimeout(timer);
  }, [isRunning, state, addMessage]);

  const handleNewProject = () => {
    agentManager.reset();
    setState({
      goal: '',
      tasks: [],
      messages: [],
      graph: { nodes: [], links: [] },
      agents: AGENTS,
    });
    setInputGoal('');
    setIsRunning(false);
    setIsPlanning(false);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="h-16 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Forge</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Multi-Agent Software Team</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={14} />
            New Project
          </button>
          <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">System Online</span>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-88px)]">
        {/* Left Column: Controls & Agents */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2">
          {/* Project Input */}
          <section className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm space-y-4 ring-2 ring-emerald-500/20">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-emerald-500" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Create Project</h2>
            </div>
            <div className="space-y-3">
              <textarea 
                ref={inputRef}
                value={inputGoal}
                onChange={(e) => setInputGoal(e.target.value)}
                placeholder="Describe the software you want to build (e.g., 'A real-time chat app with file sharing')..."
                className="w-full h-32 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-none placeholder:text-slate-400"
                disabled={isRunning || isPlanning}
              />
              <button 
                onClick={handleStartProject}
                disabled={isRunning || isPlanning || !inputGoal.trim()}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20"
              >
                {isPlanning ? (
                  <>
                    <RotateCcw className="animate-spin" size={16} />
                    Planning...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Initialize Team
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Agents List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Agents</h2>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {state.agents.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {state.agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        </div>

        {/* Middle Column: Main Visualization */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'graph', label: 'Knowledge Graph', icon: Network },
              { id: 'tasks', label: 'Task Board', icon: MessageSquare },
              { id: 'files', label: 'Project Files', icon: Terminal },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Content */}
          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full grid grid-rows-2 gap-6"
                >
                  <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-slate-900">Project Overview</h2>
                      <div className="flex items-center gap-2">
                        {state.tasks.length > 0 && state.tasks.every(t => t.status === 'done') && (
                          <button 
                            onClick={() => downloadAllFiles(state.tasks, state.goal)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100 transition-all"
                          >
                            <Download size={12} />
                            Download ZIP
                          </button>
                        )}
                        <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {state.tasks.filter(t => t.status === 'done').length} / {state.tasks.length} Tasks Done
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl relative overflow-hidden">
                      {state.goal ? (
                        <div className="text-center max-w-md space-y-2">
                          <p className="text-sm text-slate-600 italic">"{state.goal}"</p>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-emerald-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${(state.tasks.filter(t => t.status === 'done').length / (state.tasks.length || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 p-8">
                          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
                            <Plus size={32} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-slate-900">Ready to build?</h3>
                            <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                              Enter your project goal in the <span className="text-emerald-600 font-bold">Create Project</span> section to begin.
                            </p>
                          </div>
                          <button 
                            onClick={handleNewProject}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                          >
                            Start New Project
                          </button>
                          <motion.div 
                            animate={{ x: [-5, 5, -5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="hidden lg:block absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                          >
                            <Plus size={24} className="rotate-90" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-full min-h-0">
                    <TaskBoard tasks={state.tasks.slice(0, 4)} agents={state.agents} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'graph' && (
                <motion.div 
                  key="graph"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="h-full"
                >
                  <KnowledgeGraph graph={state.graph} />
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div 
                  key="tasks"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="h-full"
                >
                  <TaskBoard tasks={state.tasks} agents={state.agents} />
                </motion.div>
              )}

              {activeTab === 'files' && (
                <motion.div 
                  key="files"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  <FileExplorer tasks={state.tasks} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Activity Log */}
        <div className="lg:col-span-3 h-full min-h-0">
          <ActivityLog messages={state.messages} agents={state.agents} />
        </div>
      </main>
    </div>
  );
}
