import React from 'react';
import { Check, X, Calendar, Clock } from 'lucide-react';

interface ResultCardProps {
  image: string;
  content: string;
  hashtags: string[];
  onAccept: () => void;
  onReject: () => void;
  status?: string;
  scheduledDate?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ image, content, hashtags, onAccept, onReject, status, scheduledDate }) => {
  const isScheduled = status === 'SCHEDULED';

  return (
    <div className={`bg-white/80 backdrop-blur-md border ${isScheduled ? 'border-green-200 bg-green-50/30' : 'border-slate-200'} rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-xl`}>
      <img src={image} alt="Generated Content" className="w-full h-48 object-cover" />
      
      <div className="p-5 space-y-4">
        {/* Status Badge */}
        {isScheduled && (
          <div className="flex items-center gap-2 text-green-600 bg-green-100/50 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Calendar size={12} /> Scheduled: {new Date(scheduledDate || "").toLocaleString()}
          </div>
        )}

        <p className="font-['Merriweather'] text-slate-800 text-sm leading-relaxed">{content}</p>
        
        {/* Buttons: Only show if NOT scheduled */}
        {!isScheduled ? (
          <div className="flex gap-3 pt-2">
            <button onClick={onAccept} className="flex-1 bg-slate-900 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md active:scale-95">
              <Check size={18} /> Accept
            </button>
            <button onClick={onReject} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95">
              <X size={18} /> Reject
            </button>
          </div>
        ) : (
          <div className="pt-2 text-center py-2 bg-slate-100 rounded-xl text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
            <Clock size={14} /> Waiting for Trigger...
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;