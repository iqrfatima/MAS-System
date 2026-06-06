import { Type } from "@google/genai";
import { getGeminiJSON } from "./gemini";
import { Task, ProjectState, Message, GraphNode, GraphLink } from "../types";
import { AGENTS, SYSTEM_INSTRUCTIONS } from "../constants";
import { agentManager } from "./agentManager";

export const planProject = async (goal: string): Promise<Task[]> => {
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        filename: { type: Type.STRING, description: "A suggested filename for this task's output (e.g., schema.sql, App.tsx)" },
        assignedTo: { type: Type.STRING, description: "Role name (Architect, Frontend, etc.)" },
        dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["id", "title", "description", "filename", "assignedTo", "dependencies"],
    },
  };

  const prompt = `Break down the following software project goal into a list of tasks: "${goal}". 
  Assign each task to one of these roles: Architect, Frontend, Backend, QA, DevOps, Writer.
  Ensure dependencies are correctly identified.`;

  const rawTasks = await getGeminiJSON<any[]>(prompt, schema, SYSTEM_INSTRUCTIONS.Orchestrator);
  
  return rawTasks.map(t => ({
    ...t,
    status: 'todo',
    assignedTo: AGENTS.find(a => a.role === t.assignedTo)?.id || t.assignedTo
  }));
};

export const agentStep = async (
  agentId: string, 
  task: Task, 
  state: ProjectState
): Promise<{ 
  output: string; 
  messages: Message[]; 
  nodes: GraphNode[]; 
  links: GraphLink[] 
}> => {
  // Now using the stateful agentManager which maintains per-agent chat history
  return agentManager.processTask(agentId, task, state);
};
