import { Check, X, Calendar, Clock, Send } from 'lucide-react';
import React, { useState } from 'react';

interface ResultCardProps {
  image: string;
  content: string;
  hashtags: string[];
  onAccept: () => void;
  onReject: () => void;
  status?: string;
  scheduledDate?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ image, content, onAccept, onReject, status, scheduledDate }) => {
  const isScheduled = status === 'SCHEDULED';
  const isPublished = status === 'PUBLISHED';
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  const dotColor = isPublished
    ? 'bg-green-600 ring-blue-100'
    : isScheduled
    ? 'bg-sky-600 ring-sky-100'
    : '';

const parseContent = (text: string) => {
  const parts = text.split(/\*{1,2}(.*?)\*{1,2}/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-bold text-slate-900">{part}</strong>
      : part
  );
};

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-400 rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-xl">
      <img src={image} alt="Generated Content" className="w-full h-48 object-cover" />

      <div className="p-5 space-y-4">
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
                {isPublished
                  ? 'Published on'
                  : isScheduled
                  ? 'Scheduled for'
                  : 'Confirm Time?'}
              </p>

              <p className="text-[15px] text-slate-600 font-semibold font-['Montserrat'] leading-snug">
                {new Date(scheduledDate).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>

            {(isScheduled || isPublished) && (
              <div className={`ml-auto w-2 h-2 rounded-full ring-2 ${dotColor}`} />
            )}

          </div>
        )}

        {/* Buttons */}
        {!isScheduled && !isPublished ? (
          <div className="flex gap-3 pt-2">
            <button onClick={onAccept} className="flex-1 bg-slate-900 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md active:scale-95">
              <Check size={18} /> Accept
            </button>
            <button onClick={onReject} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95">
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