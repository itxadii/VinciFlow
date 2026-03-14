import React from 'react';
import { PanelLeftClose, Workflow, LogOut, GalleryHorizontalEnd } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleSignOut = () => {
    if (onSignOut) onSignOut();
    navigate('/');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out flex flex-col
        bg-slate-300 border-r border-slate-400 overflow-hidden w-72
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Header */}
        <div className="pt-6 md:pt-20 pb-4 px-4 border-b border-slate-400/40 flex flex-col gap-6 min-w-[18rem]">
          <div className="flex items-center justify-between">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <span className="text-2xl font-bold text-slate-800 font-['Handlee']">VinciFlow</span>
            </Link>
            <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-900">
              <PanelLeftClose size={20} />
            </button>
          </div>

          <button
            onClick={() => { onNewChat(); if (window.innerWidth < 768) setIsOpen(false); }}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-400/20 border-4 border-slate-400 rounded-full hover:bg-slate-400/40 transition-all font-['Merriweather'] font-bold text-sm text-slate-800"
          >
            <Workflow size={18} /> New Flow
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1 flex flex-col min-w-[18rem]">
          <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-['Merriweather']">
            Recent History
          </p>

          {/* ✅ Reverse so latest session appears at top */}
          {[...sessions].reverse().map((session) => (
            <button
              key={session.sessionId || Math.random().toString()}
              onClick={() => {
                if (session.sessionId) onSelectSession(session.sessionId);
                if (window.innerWidth < 768) setIsOpen(false);
              }}
              className={`w-full text-left p-3 rounded-full transition-all ${
                currentSessionId === session.sessionId
                  ? 'bg-slate-400/50 text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-400/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <GalleryHorizontalEnd size={13} className="shrink-0 opacity-50" />
                <span className="text-sm truncate block font-['Merriweather'] font-bold">
                  {session.lastMsg || "New Conversation"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-slate-400/40 bg-slate-400/10 font-['Merriweather'] font-bold min-w-[18rem]">
          <div className="flex items-center gap-3 px-1 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userEmail?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-slate-800 truncate">{userEmail}</span>
              <span className="text-[10px] text-slate-600 font-['Montserrat']">Free Tier</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;