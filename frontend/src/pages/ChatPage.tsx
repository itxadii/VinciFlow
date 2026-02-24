import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PanelLeftOpen } from 'lucide-react'; 
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import { sendMessageToBackend, getChatHistory } from '../services/api';
import { convertToBase64 } from '../utils/file';
import type { Message, ChatRequest } from '../types/chat';
import { getBrandProfile } from '../services/brandApi'; 
import { useNavigate } from 'react-router-dom';

const ChatPage: React.FC<{ signOut?: () => void; user?: any }> = ({ signOut, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<{ sessionId: string; lastMsg: string }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(uuidv4());
  const navigate = useNavigate();

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 1. DYNAMO COST SAVER: Fetch sessions ONLY on mount or user change
  useEffect(() => { 
  loadSessions(); 
  }, [user]);

  useEffect(() => {
    const checkBrand = async () => {
      try {
        const brandData = await getBrandProfile(); 
        if (!brandData) {
          // FIX 2: Use the 'navigate' function, NOT the hook
          navigate('/onboarding'); 
        }
      } catch (e) {
        console.error("Brand check failed", e);
      }
    };
    if (user) checkBrand();
  }, [user, navigate]);

  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, isLoading]);

  const loadSessions = async () => {
    try {
      const history = await getChatHistory();
      if (history && Array.isArray(history)) {
        const uniqueSessions = Array.from(new Set(history.map((m: any) => m.SessionId)))
          .map(id => ({
            sessionId: id as string,
            lastMsg: history.find((m: any) => m.SessionId === id)?.UserMessage || "New Flow"
          }));
        setSessions(uniqueSessions);
      }
    } catch (e) { 
      console.error("DynamoDB Read Error:", e); 
    }
  };

  // 2. LOCAL UPDATE: Update sidebar history without calling DynamoDB again
  const updateLocalHistory = (sessionId: string, lastMsg: string) => {
    setSessions(prev => {
      const exists = prev.find(s => s.sessionId === sessionId);
      if (exists) {
        return prev.map(s => s.sessionId === sessionId ? { ...s, lastMsg } : s);
      }
      return [{ sessionId, lastMsg }, ...prev];
    });
  };

  const loadSpecificChat = async (sid: string) => {
    setCurrentSessionId(sid);
    try {
      // Note: Loading a specific chat still requires one fetch
      const historyData = await getChatHistory();
      const chatMsgs: Message[] = historyData
        .filter((m: any) => m.SessionId === sid)
        .flatMap((m: any) => [
          { role: 'user' as const, content: m.UserMessage, id: uuidv4(), timestamp: Number(m.Timestamp) },
          { role: 'assistant' as const, content: m.AgentResponse, id: uuidv4(), timestamp: Number(m.Timestamp) }
        ]);
      setMessages(chatMsgs);
    } catch (e) { console.error(e); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userMsgText = input; 
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user' as const,
      content: selectedFile ? `📎 [${selectedFile.name}] ${input}` : input,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const payload: ChatRequest = { prompt: userMsgText, sessionId: currentSessionId };
      if (selectedFile) {
        payload.file = { name: selectedFile.name, type: selectedFile.type, data: await convertToBase64(selectedFile) };
      }
      
      const data = await sendMessageToBackend(payload);
      const aiMsg: Message = { id: uuidv4(), role: 'assistant' as const, content: data.response, timestamp: Date.now() };
      
      setMessages(prev => [...prev, aiMsg]);
      
      // Update sidebar locally to save DynamoDB costs
      updateLocalHistory(currentSessionId, userMsgText);

    } catch (error) { 
      console.error("Backend communication failed:", error); 
    } finally { 
      setIsLoading(false); 
      setInput(''); 
      setSelectedFile(null); 
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden font-['Montserrat'] relative bg-[#f9f9f8] m-0 p-0">
      
      {/* Sidebar Logic: always fixed, overlaps content */}
      <Sidebar 
        isOpen={isSidebarOpen} setIsOpen={setSidebarOpen}
        sessions={sessions} currentSessionId={currentSessionId}
        onSelectSession={loadSpecificChat} 
        onNewChat={() => { 
          setCurrentSessionId(uuidv4()); 
          setMessages([]); 
        }}
        userEmail={user?.signInDetails?.loginId} onSignOut={signOut}
      />

      {/* Main Content Area: w-full so it always fills entire screen */}
      <div className="w-full flex flex-col min-w-0 relative bg-transparent h-full overflow-hidden">
        
        {/* Toggle Button for when Sidebar is HIDDEN */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute top-10 left-6 z-40 p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 transition-all active:scale-95"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        {/* Welcome Header: Merriweather Bold + Handlee Branding */}
        {messages.length === 0 && !isLoading && (
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full z-0 px-6">
             <h1 className="text-5xl md:text-6xl font-['Merriweather'] font-bold text-slate-800 mb-6 tracking-tight">
               Back at it, <span className="font-['Handlee'] text-slate-600">{user?.signInDetails?.loginId?.split('@')[0] || "Aditya"}</span>
             </h1>
             <p className="font-['Handlee'] text-slate-400 text-2xl italic">Ready to synthesize your next flow?</p>
          </div>
        )}

        {/* Message Viewport */}
        <MessageList messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
        
        {/* Input Bar */}
        <ChatInput 
          input={input} setInput={setInput} onSend={handleSend}
          selectedFile={selectedFile} setSelectedFile={setSelectedFile}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatPage;