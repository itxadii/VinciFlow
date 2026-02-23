import React from 'react';
import { PanelLeftClose, PlusCircle, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sessions: { sessionId: string; lastMsg: string }[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  userEmail?: string;
  onSignOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen, setIsOpen, sessions, currentSessionId, onSelectSession, onNewChat, userEmail, onSignOut
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/10 z-20 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed md:relative z-30 h-full transition-all duration-300 ease-in-out flex flex-col
        /* Simple Grey Background - Slate-300 */
        bg-slate-300 border-r border-slate-400
        ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:hidden'}
      `}>
        
        {/* 1. Header: pt-20 Margin + Handlee Logo + Toggle */}
        <div className="pt-15 pb-4 px-4 border-b border-slate-400/40 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            {/* Logo: Handlee Font */}
            <span className="text-2xl font-bold text-slate-800 font-['Handlee']">
                VinciFlow
            </span>
            <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-900 transition-colors">
              <PanelLeftClose size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => { onNewChat(); if(window.innerWidth < 768) setIsOpen(false); }}
            /* Text: Merriweather, Bold */
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-400/20 border border-slate-400 rounded-xl hover:bg-slate-400/40 transition-all font-['Merriweather'] font-bold text-sm text-slate-800"
          >
            <PlusCircle size={18} /> New Chat
          </button>
        </div>

        {/* 2. Chat History: Merriweather Bold, Scrollbar Hidden */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1 flex flex-col">
          <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-['Merriweather']">
            Recent History
          </p>
          
          {sessions.map((session) => (
            <button
              key={session.sessionId || Math.random().toString()}
              onClick={() => { 
                if (session.sessionId) onSelectSession(session.sessionId); 
                if(window.innerWidth < 768) setIsOpen(false); 
              }}
              className={`w-full text-left p-3 rounded-xl transition-all font-['Merriweather'] font-bold ${
                currentSessionId === session.sessionId 
                  ? 'bg-slate-400/50 text-slate-900' 
                  : 'text-slate-600 hover:bg-slate-400/20 hover:text-slate-800'
              }`}
            >
              <span className="text-sm truncate block">
                {session.lastMsg || "New Conversation"}
              </span>
            </button>
          ))}
        </div>

        {/* 3. User Section: Merriweather Bold */}
        <div className="p-4 border-t border-slate-400/40 bg-slate-400/10 font-['Merriweather'] font-bold">
          <div className="flex items-center gap-3 px-1 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center text-white text-xs font-bold">
              {userEmail?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-slate-800 truncate">{userEmail}</span>
              <span className="text-[10px] text-slate-500 uppercase">Pro Developer</span>
            </div>
          </div>
          <button 
            onClick={onSignOut}
            className="w-full py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;