// src/services/api.ts
import axios from 'axios';
import type { AxiosInstance } from 'axios'; // Unused InternalAxiosRequestConfig hata diya
import { fetchAuthSession } from 'aws-amplify/auth';
import type { ChatRequest, ChatResponse } from '../types/chat'; // Central types use karo

// 1. apiClient ko define karna zaroori hai
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 2. Auth Interceptor
apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Auth failed:', error);
  }
  return config;
});

export const sendMessageToBackend = async (payload: ChatRequest): Promise<ChatResponse> => {
  // '' ki jagah '/' use karein taaki root path hit ho
  const response = await apiClient.post<ChatResponse>('/', { 
    prompt: payload.prompt,
    sessionId: payload.sessionId,
    file: payload.file || null,
    isTemporary: payload.isTemporary || false
  });
  return response.data;
};

export const updateFlowStatus = async (timestamp: number, sessionId: string, status: 'SCHEDULED' | 'REJECTED'): Promise<any> => {
  try {
    const response = await apiClient.post('/schedule', {
      timestamp, // Primary key identifier
      sessionId,
      status     // New status to update in DynamoDB
    });
    return response.data;
  } catch (error) {
    console.error("Error updating flow status:", error);
    throw error;
  }
};

export const getChatHistory = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get('/'); 
    return response.data.history; 
  } catch (error) {
    console.error("Error fetching history:", error);
    throw error;
  }
};