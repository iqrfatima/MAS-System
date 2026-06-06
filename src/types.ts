export type Role = 'Architect' | 'Frontend' | 'Backend' | 'QA' | 'DevOps' | 'Writer';

export interface Agent {
  id: string;
  name: string;
  role: Role;
  status: 'idle' | 'thinking' | 'working' | 'reviewing';
  avatar: string;
  bio: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  filename?: string;
  assignedTo?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  dependencies: string[];
  output?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId?: string; // If undefined, it's a broadcast to the whole team
  content: string;
  timestamp: number;
  type: 'thought' | 'action' | 'communication' | 'system' | 'request' | 'response';
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'decision' | 'component' | 'requirement' | 'dependency';
  agentId: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ProjectState {
  goal: string;
  tasks: Task[];
  messages: Message[];
  graph: KnowledgeGraph;
  agents: Agent[];
}
