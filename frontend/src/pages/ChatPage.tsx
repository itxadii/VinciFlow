import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { sendMessageToBackend } from '../services/api';
import { convertToBase64 } from '../utils/file'; 
import type { Message, ChatRequest } from '../types/chat';

interface ChatPageProps {
  signOut?: () => void;
  user?: any;
}

const ChatPage: React.FC<ChatPageProps> = ({ signOut, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId] = useState(uuidv4());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic: Jab bhi messages update honge, screen niche move karegi
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: selectedFile ? `📎 [${selectedFile.name}] ${input}` : input,
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    const currentInput = input;
    const currentFile = selectedFile;
    
    setInput('');
    setSelectedFile(null);

    try {
      const payload: ChatRequest = {
        prompt: currentInput,
        sessionId: sessionId,
      };

      if (currentFile) {
        const base64Data = await convertToBase64(currentFile);
        payload.file = {
          name: currentFile.name,
          type: currentFile.type,
          data: base64Data
        };
      }

      const data = await sendMessageToBackend(payload);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response, // Backend payload 'response' key matches
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("VinciFlow Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* 1. Header: Resolves unused props warnings */}
      <header className="p-4 bg-white border-b shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-blue-600">VinciFlow AI</h1>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded uppercase font-bold">Dev</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-600 hidden sm:block">
            {user?.signInDetails?.loginId || "VinciFlow User"}
          </span>
          <button 
            onClick={signOut}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* 2. Chat History */}
      <main className="flex-1 overflow-y-auto p-4 md:px-20 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
            <span className="text-4xl mb-2">✨</span>
            <p>Welcome to VinciFlow. Upload an image or start typing!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-gray-400 italic text-sm animate-pulse">
              VinciFlow is thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      {/* 3. Footer: Input & File logic */}
      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto space-y-2">
          {selectedFile && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs w-fit border border-blue-200 animate-in fade-in slide-in-from-bottom-1">
              📎 {selectedFile.name}
              <button type="button" onClick={() => setSelectedFile(null)} className="font-bold ml-1 hover:text-red-500">×</button>
            </div>
          )}

          <div className="flex gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*,application/pdf"
            />
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              title="Upload Image/PDF"
            >
              📷
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask VinciFlow (analyze logo, brand colors, etc.)..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 shadow-md active:scale-95 transition-all"
            >
              Send
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;