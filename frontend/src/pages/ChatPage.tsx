import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PanelLeftOpen, X, Sparkles } from 'lucide-react'; 
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import ResultCard from '../components/GeneratedResults';
import { sendMessageToBackend, getChatHistory, apiClient, updateFlowStatus } from '../services/api'; // Added updateFlowStatus
import { convertToBase64 } from '../utils/file';
import type { Message, ChatRequest } from '../types/chat';
import { getBrandProfile } from '../services/brandApi'; 
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import { toast } from 'react-hot-toast'; 

const ChatPage: React.FC<{ signOut?: () => void; user?: any }> = ({ signOut, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<{ sessionId: string; lastMsg: string }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(uuidv4());
  
  const [showResults, setShowResults] = useState(false); // Default false until flow starts
  const [generatedItems, setGeneratedItems] = useState<any[]>([]); // Using real data instead of mock
  const [rightPanelWidth, setRightPanelWidth] = useState(450); 
  const isResizing = useRef(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // --- 1. RESIZING LOGIC (UNTOUCHED) ---
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

  // --- 2. AUTH & BRAND SYNC (UNTOUCHED) ---
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

  // --- 3. UPDATED DATA FETCHING (CHAT VS FLOWS) ---
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

  const loadSpecificChat = async (sid: string) => {
    setCurrentSessionId(sid);
    try {
      const historyData = await getChatHistory();
      const sessionItems = historyData.filter((m: any) => m.SessionId === sid);

      // Separate Normal Messages
      const chatMsgs: Message[] = sessionItems
        .filter((m: any) => !m.Status) // Chat items don't have Status key
        .flatMap((m: any) => [
          { role: 'user' as const, content: m.UserMessage, id: uuidv4(), timestamp: Number(m.Timestamp) },
          { role: 'assistant' as const, content: m.AgentResponse, id: uuidv4(), timestamp: Number(m.Timestamp) }
        ]);
      setMessages(chatMsgs);

      // Separate Flow Drafts
      const flows = sessionItems.filter((m: any) => m.Status === 'DRAFT' || m.Status === 'SCHEDULED');
      setGeneratedItems(flows);
      if (flows.length > 0) setShowResults(true);
      else setShowResults(false);

    } catch (e) { console.error(e); }
  };

  // --- 4. POLLING FOR STEP FUNCTIONS ---
  const startPolling = (sid: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const history = await getChatHistory();
      const flows = history.filter((m: any) => m.SessionId === sid && m.Status === 'DRAFT');
      
      if (flows.length > 0 || attempts > 15) {
        setGeneratedItems(flows);
        setShowResults(true);
        clearInterval(interval);
      }
    }, 3000); // Polling every 3 seconds
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;
    const userMsgText = input; 
    setMessages(prev => [...prev, { id: uuidv4(), role: 'user', content: input, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const payload: ChatRequest = { prompt: userMsgText, sessionId: currentSessionId };
      if (selectedFile) payload.file = { name: selectedFile.name, type: selectedFile.type, data: await convertToBase64(selectedFile) };
      
      const data = await sendMessageToBackend(payload);
      
      // If Step Function triggers, start polling
      if ((data as any).message === 'Pipeline Started') {
        toast.success("Synthesis Started... ⚡");
        startPolling(currentSessionId);
      }

      const aiMsg: Message = { id: uuidv4(), role: 'assistant', content: data.response || "Synthesis in progress...", timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); setInput(''); setSelectedFile(null); }
  };

  // --- 5. ACCEPT/REJECT HANDLERS ---
  const handleAcceptFlow = async (item: any) => {
  // 1. Loading state for specific item (Optional toast)
  const toastId = toast.loading("Scheduling Aura Flow...");
  
  try {
    // 2. Call API with timestamp, session, and the target time
    await apiClient.post('/schedule', {
      timestamp: item.Timestamp,
      sessionId: item.SessionId,
      status: 'SCHEDULED',
      scheduledTime: item.ScheduledDate // 🚀 LLM parsed this earlier
    });

    toast.success("Post successfully locked & scheduled! 🚀", { id: toastId });
    
    // 3. UI Sync: Refresh data to show the 'Scheduled' badge
    loadSpecificChat(currentSessionId); 
    
  } catch (err) {
    console.error("Scheduling failed:", err);
    toast.error("Failed to sync with EventBridge.", { id: toastId });
  }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden font-['Montserrat'] relative bg-[#f9f9f8] m-0 p-0">
      
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
        <div className="flex flex-col min-w-0 h-full relative grow bg-transparent overflow-hidden">
          {!isSidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="absolute top-10 left-6 z-40 p-2.5 bg-white border border-[#E3DBBB] rounded-xl shadow-sm">
              <PanelLeftOpen size={20} className="text-slate-600" />
            </button>
          )}

          {messages.length === 0 && !isLoading && (
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full z-0 px-6">
               <h1 className="text-5xl md:text-6xl font-['Merriweather'] font-bold text-slate-800 mb-6 tracking-tight">
                 Back at it, <span className="font-['Handlee'] text-slate-600">{user?.signInDetails?.loginId?.split('@')[0] || "Creative"}</span>
               </h1>
            </div>
          )}

          <MessageList messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
          <ChatInput input={input} setInput={setInput} onSend={handleSend} selectedFile={selectedFile} setSelectedFile={setSelectedFile} isLoading={isLoading} />
        </div>

        {showResults && (
          <div onMouseDown={startResizing} className="w-1.5 h-full cursor-col-resize bg-[#E3DBBB] hover:bg-slate-400 transition-colors z-50 flex items-center justify-center group">
             <div className="w-px h-10 bg-white/40 group-hover:bg-white" />
          </div>
        )}

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

            <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 no-scrollbar pb-24">
              {generatedItems.length === 0 && <p className="text-slate-400 text-center py-10">Synthesizing your flows...</p>}
              {generatedItems.map((item) => (
              <ResultCard 
                key={item.Timestamp}
                image={item.ImageUrl || 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png'}
                content={item.AgentResponse}
                hashtags={[]}
                status={item.Status}
                scheduledDate={item.ScheduledDate} // 🚀 Pass the date to the card
                onAccept={() => handleAcceptFlow(item)}
                onReject={() => setGeneratedItems(prev => prev.filter(i => i.Timestamp !== item.Timestamp))}
              />
            ))}
            </div>
          </aside>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ChatPage;