import React, { useState } from 'react';
import { Task } from '../types';
import { File, Folder, ChevronRight, ChevronDown, Code, FileText, Database, Globe, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import JSZip from 'jszip';

interface Props {
  tasks: Task[];
}

export const downloadAllFiles = async (tasks: Task[], projectName: string = 'forge-project') => {
  const completedTasks = tasks.filter(t => t.status === 'done' && t.output);
  if (completedTasks.length === 0) return;

  const zip = new JSZip();
  completedTasks.forEach((task) => {
    const filename = task.filename || `task-${task.id}.txt`;
    zip.file(filename, task.output || '');
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const FileExplorer: React.FC<Props> = ({ tasks }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const completedTasks = tasks.filter(t => t.status === 'done' && t.output);
  const selectedTask = completedTasks.find(t => t.id === selectedFileId);

  const getFileIcon = (filename: string = '') => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return <Code size={14} className="text-blue-400" />;
    if (filename.endsWith('.sql') || filename.endsWith('.db')) return <Database size={14} className="text-amber-400" />;
    if (filename.endsWith('.html') || filename.endsWith('.css')) return <Globe size={14} className="text-emerald-400" />;
    return <FileText size={14} className="text-slate-400" />;
  };

  return (
    <div className="flex h-full bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-slate-400" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Files</h3>
          </div>
          {completedTasks.length > 0 && (
            <button 
              onClick={() => downloadAllFiles(tasks)}
              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
              title="Download All Files"
            >
              <Download size={14} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {completedTasks.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-[10px] text-slate-400 font-medium">No files generated yet. Complete tasks to see output.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {completedTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedFileId(task.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                    selectedFileId === task.id 
                      ? "bg-white text-slate-900 shadow-sm border border-black/5" 
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {getFileIcon(task.filename)}
                  <span className="truncate">{task.filename || `task-${task.id}.txt`}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedTask ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedTask.filename)}
                <span className="text-xs font-bold text-slate-700">{selectedTask.filename}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {selectedTask.output?.length || 0} bytes
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm">
              <div className="prose prose-slate prose-sm max-w-none">
                <ReactMarkdown>{selectedTask.output || ''}</ReactMarkdown>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
              <File size={32} />
            </div>
            <p className="text-xs font-medium">Select a file to view its content</p>
          </div>
        )}
      </div>
    </div>
  );
};
