import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types/chat';
import { sendMessageToBackend } from '../services/api';

// 1. Updated Interface to accept Auth props
interface ChatPageProps {
  signOut?: () => void;
  user?: any;
}

const ChatPage: React.FC<ChatPageProps> = ({ signOut, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendMessageToBackend(input);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
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
      {/* 2. Professional Header with Logout */}
      <header className="p-4 bg-white border-b shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-blue-600">VinciFlow AI</h1>
          <span className="hidden md:inline px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded uppercase font-bold tracking-wider">
            Dev Mode
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            {/* Displaying Cognito User ID or Email */}
            <p className="text-xs font-semibold text-gray-700">
              {user?.signInDetails?.loginId || "User Session"}
            </p>
            <p className="text-[10px] text-gray-400">ap-south-1</p>
          </div>
          <button 
            onClick={signOut}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Scrollable Message Container */}
      <main className="flex-1 overflow-y-auto p-4 md:px-20 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-gray-500 font-medium">No messages yet. Ask VinciFlow to generate something!</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border text-gray-800 rounded-tl-none'
            }`}>
              <p className="leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border px-4 py-3 rounded-2xl rounded-tl-none animate-pulse text-gray-400 italic flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
              VinciFlow is thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      {/* Sticky Input Footer */}
      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask VinciFlow something..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
          >
            <span>Send</span>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;