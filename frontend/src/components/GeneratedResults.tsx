import { Check, X, Calendar, Clock, Send } from 'lucide-react';
import React, { useState } from 'react';

interface ResultCardProps {
  image: string;
  content: string;
  hashtags: string[];
  onAccept: (platforms: string[]) => void;
  onReject: () => void;
  status?: string;
  scheduledDate?: string;
}

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="url(#igGrad)">
    <defs>
      <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433"/>
        <stop offset="25%" stopColor="#e6683c"/>
        <stop offset="50%" stopColor="#dc2743"/>
        <stop offset="75%" stopColor="#cc2366"/>
        <stop offset="100%" stopColor="#bc1888"/>
      </linearGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const PLATFORMS = [
  { id: 'X', icon: <XIcon />, selectedBg: 'bg-black text-white border-black', unselectedBg: 'bg-white text-slate-400 border-slate-200' },
  { id: 'INSTAGRAM', label: 'Instagram', icon: <InstagramIcon />, selectedBg: 'bg-black text-white border-black', unselectedBg: 'bg-white text-slate-400 border-slate-200' },
  { id: 'FACEBOOK', label: 'Facebook', icon: <FacebookIcon />, selectedBg: 'bg-black text-white border-black', unselectedBg: 'bg-white text-slate-400 border-slate-200' },
];

const ResultCard: React.FC<ResultCardProps> = ({ image, content, onAccept, onReject, status, scheduledDate }) => {
  const isScheduled = status === 'SCHEDULED';
  const isPublished = status === 'PUBLISHED';
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['X']);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const dotColor = isPublished ? 'bg-green-600 ring-blue-100' : isScheduled ? 'bg-sky-600 ring-sky-100' : '';

  const parseContent = (text: string) => {
    const parts = text.split(/\*{1,2}(.*?)\*{1,2}/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-400 rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-xl">
      <img src={image} alt="Generated Content" className="w-full h-48 object-cover" />

      <div className="p-5 space-y-4">

        {/* Content */}
        <p className="font-['Merriweather'] text-slate-800 text-sm leading-relaxed">
          {parseContent(content)}
        </p>
        <div className="h-px bg-slate-100" />

        {/* Scheduled timestamp */}
        {scheduledDate && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
              <Calendar size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">
                {isPublished ? 'Published on' : isScheduled ? 'Scheduled for' : 'Confirm Time?'}
              </p>
              <p className="text-[15px] text-slate-600 font-semibold font-['Montserrat'] leading-snug">
                {new Date(scheduledDate).toLocaleString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: 'numeric', minute: '2-digit', hour12: true
                })}
              </p>
            </div>
            {(isScheduled || isPublished) && (
              <div className={`ml-auto w-2 h-2 rounded-full ring-2 ${dotColor}`} />
            )}
          </div>
        )}

        {/* Platform selector — only when DRAFT */}
        {!isScheduled && !isPublished && (
          <div className="space-y-2">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Post to</p>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => {
                const selected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[15px] font-bold border transition-all active:scale-95 ${
                      selected ? p.selectedBg : p.unselectedBg
                    }`}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        {!isScheduled && !isPublished ? (
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => selectedPlatforms.length > 0 && onAccept(selectedPlatforms)}
              disabled={selectedPlatforms.length === 0}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md active:scale-95 ${
                selectedPlatforms.length === 0
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              <Check size={18} /> Accept
            </button>
            <button
              onClick={onReject}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95"
            >
              <X size={18} /> Reject
            </button>
          </div>
        ) : isScheduled ? (
          <div className="py-2 bg-slate-100 rounded-xl text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
            <Clock size={14} /> SCHEDULED
          </div>
        ) : (
          <div className="py-2 bg-slate-100 rounded-xl text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
            <Send size={14} /> PUBLISHED
          </div>
        )}

      </div>
    </div>
  );
};

export default ResultCard;