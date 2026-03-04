// src/types/chat.ts

export interface Message {
  id: string;
  role: 'user' | 'assistant'; 
  content: string;
  timestamp: number;
}

// 1. Backend Key alignment: 'response' matches your Lambda
export interface ChatResponse {
  response: string; 
  sessionId: string;
  status?: 'success' | 'error';
  message?: string
}

// 2. Multimodal Payload for Nova Lite
export interface FilePayload {
  name: string;
  type: string;
  data: string; // Base64 encoded string
}

// 3. Strict Request Type for sendMessageToBackend
export interface ChatRequest {
  prompt: string;
  sessionId: string;
  file?: FilePayload;
  isTemporary?: boolean;
}