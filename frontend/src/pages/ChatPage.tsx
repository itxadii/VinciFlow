// 1. Added useCallback to imports
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PanelLeftOpen, X, Sparkles } from 'lucide-react'; 
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import ResultCard from '../components/GeneratedResults';
import { sendMessageToBackend, getChatHistory, apiClient } from '../services/api';
import { convertToBase64 } from '../utils/file';
import type { Message, ChatRequest } from '../types/chat';
import { getBrandProfile } from '../services/brandApi'; 
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import { toast } from 'react-hot-toast'; 

const mockGenerated = [
  { 
    id: 'demo-1', 
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', 
    text: "Lace up for the future. #NikeFlow", 
    tags: ['Nike', 'Innovation', 'Style'] 
  }
];

const ChatPage: React.FC<{ signOut?: () => void; user?: any }> = ({ signOut, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<{ sessionId: string; lastMsg: string }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(uuidv4());
  
  // --- RESIZING & THEME STATE ---
  const [showResults, setShowResults] = useState(true); 
  const [generatedItems, setGeneratedItems] = useState(mockGenerated);
  const [rightPanelWidth, setRightPanelWidth] = useState(450); 
  const isResizing = useRef(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // --- RESIZING LOGIC ---
  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    // Limits: Min 320px, Max 70% of screen
    if (newWidth > 320 && newWidth < window.innerWidth * 0.7) {
      setRightPanelWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // (Existing Auth/Brand logic kept exactly same as per your request)
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code && state) {
      const handleXCallback = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.post('/auth/x/callback', { code, state });
          if (response.status === 200) {
            toast.success("X Account Linked! 🚀");
            navigate('/chat', { replace: true });
          }
        } catch (error) { toast.error("Aura Sync Failed."); } finally { setIsLoading(false); }
      };
      handleXCallback();
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) { navigate('/login', { replace: true }); return; }
      try {
        const brandData = await getBrandProfile();
        if (!brandData || !brandData.BrandName) { navigate('/onboarding', { replace: true }); }
      } catch (err) { navigate('/onboarding', { replace: true }); }
    };
    verifyAccess();
  }, [user, navigate]);

  useEffect(() => { loadSessions(); }, [user]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

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
    } catch (e) { console.error(e); }
  };

  const updateLocalHistory = (sessionId: string, lastMsg: string) => {
    setSessions(prev => {
      const exists = prev.find(s => s.sessionId === sessionId);
      if (exists) return prev.map(s => s.sessionId === sessionId ? { ...s, lastMsg } : s);
      return [{ sessionId, lastMsg }, ...prev];
    });
  };

  const loadSpecificChat = async (sid: string) => {
    setCurrentSessionId(sid);
    try {
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
    const userMsg: Message = { id: uuidv4(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const payload: ChatRequest = { prompt: userMsgText, sessionId: currentSessionId };
      if (selectedFile) payload.file = { name: selectedFile.name, type: selectedFile.type, data: await convertToBase64(selectedFile) };
      const data = await sendMessageToBackend(payload);
      
      // Checking any to bypass TS error from image_ca5500
      if ((data as any).message === 'Pipeline Started') {
        toast.success("Synthesis Started... ⚡");
        setTimeout(() => setShowResults(true), 1500);
      }

      const aiMsg: Message = { id: uuidv4(), role: 'assistant', content: data.response || "Synthesis in progress...", timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      updateLocalHistory(currentSessionId, userMsgText);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); setInput(''); setSelectedFile(null); }
  };

  return (
    // Applied New Beige Background #F8F3E1
    <div className="flex w-full h-screen overflow-hidden font-['Montserrat'] relative bg-[#f9f9f8] m-0 p-0">
      
      {/* Sidebar Wrapper (Fixes image_c9866e className error) */}
      <div className="bg-[#F8F3E1] border-r border-[#E3DBBB]">
        <Sidebar 
          isOpen={isSidebarOpen} setIsOpen={setSidebarOpen}
          sessions={sessions} currentSessionId={currentSessionId}
          onSelectSession={loadSpecificChat} 
          onNewChat={() => { setCurrentSessionId(uuidv4()); setMessages([]); setShowResults(false); }}
          userEmail={user?.signInDetails?.loginId} onSignOut={signOut}
        />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT: Chat Column */}
        <div className="flex flex-col min-w-0 h-full relative grow bg-transparent overflow-hidden">
          {!isSidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="absolute top-10 left-6 z-40 p-2.5 bg-white border border-[#E3DBBB] rounded-xl shadow-sm text-slate-600">
              <PanelLeftOpen size={20} />
            </button>
          )}

          {messages.length === 0 && !isLoading && (
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full z-0 px-6">
               <h1 className="text-5xl md:text-6xl font-['Merriweather'] font-bold text-slate-800 mb-6 tracking-tight">
                 Back at it, <span className="font-['Handlee'] text-slate-600">{user?.signInDetails?.loginId?.split('@')[0] || "Aditya"}</span>
               </h1>
            </div>
          )}

          <MessageList messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
          <ChatInput input={input} setInput={setInput} onSend={handleSend} selectedFile={selectedFile} setSelectedFile={setSelectedFile} isLoading={isLoading} />
        </div>

        {/* MIDDLE: Resizable Divider using #E3DBBB */}
        {showResults && (
          <div 
            onMouseDown={startResizing}
            className="w-1.5 h-full cursor-col-resize bg-[#E3DBBB] hover:bg-slate-400 transition-colors z-50 flex items-center justify-center group"
          >
             <div className="w-px h-10 bg-white/40 group-hover:bg-white" />
          </div>
        )}

        {/* RIGHT: Results Panel */}
        {showResults && (
          <aside 
            style={{ width: `${rightPanelWidth}px` }}
            className="hidden md:flex flex-col bg-[#F8F3E1] border-l border-[#E3DBBB] overflow-hidden animate-in slide-in-from-right duration-500"
          >
            <div className="flex items-center justify-between p-8 pb-4 bg-[#F8F3E1]">
              <div className="flex items-center gap-3">
                <Sparkles className="text-slate-800" size={24} />
                <h2 className="text-2xl font-bold text-slate-800 font-['Merriweather']">Generated Flows</h2>
              </div>
              <button onClick={() => setShowResults(false)} className="p-2 hover:bg-[#E3DBBB] rounded-full">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Content with HIDDEN scrollbar (Fix for image_c9e8f8) */}
            <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 no-scrollbar pb-24">
              {generatedItems.map((item) => (
                <ResultCard 
                  key={item.id}
                  image={item.imageUrl}
                  content={item.text}
                  hashtags={item.tags}
                  onAccept={() => toast.success("Scheduled! 🚀")}
                  onReject={() => setGeneratedItems(prev => prev.filter(i => i.id !== item.id))}
                />
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Inline Style to hide scrollbars globally */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ChatPage;