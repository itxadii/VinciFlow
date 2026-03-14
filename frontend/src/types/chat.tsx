// src/types/chat.ts

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  // Optional: attach generated flow data to a message
  flowData?: GeneratedFlow;
}

export interface GeneratedFlow {
  imageUrl: string;
  content: string;
  scheduledDate: string;
  timestamp: number;
}

// Multimodal Payload for Nova Lite
export interface FilePayload {
  name: string;
  type: string;
  data: string; // Base64 encoded string
}

// Strict Request Type
export interface ChatRequest {
  prompt: string;
  sessionId: string;
  file?: FilePayload;
  isTemporary?: boolean;
}

// All possible response shapes from your API
export interface ChatResponse {
  response?: string;
  sessionId?: string;
  status?: 'success' | 'error';
  message?: string;
  task?: 'AWAIT_CLARIFICATION' | 'GENERATE' | 'PARSE'; // ✅ task not type
  type?: 'CLARIFICATION_NEEDED' | 'FLOW_GENERATED' | 'PROCESSING' | 'ERROR';
  imageUrl?: string;
  content?: string;
  scheduledDate?: string;
  timestamp?: number;
  executionArn?: string;
}