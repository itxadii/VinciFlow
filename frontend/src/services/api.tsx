// src/services/api.ts
import axios from 'axios'; 
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'; 
import { fetchAuthSession } from 'aws-amplify/auth';
import type { ChatResponse } from '../types/chat';

// 1. Create a reusable instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Gemini can take a few seconds
});

// 2. Add Request Interceptor to inject Cognito Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // fetchAuthSession handles token refresh automatically in v6
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Auth session failed:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Sends a message to the Gemini backend.
 * Uses TypeScript Generics <ChatResponse> for strict return types.
 */
export const sendMessageToBackend = async (message: string): Promise<ChatResponse> => {
  const response = await apiClient.post<ChatResponse>('/', {
    message: message,
    // Add any metadata your Lambda needs
    timestamp: Date.now(),
  });

  return response.data;
};