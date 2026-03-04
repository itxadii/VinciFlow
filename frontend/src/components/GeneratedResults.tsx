import React from 'react';
import { Check, X } from 'lucide-react';

interface ResultCardProps {
  image: string;
  content: string;
  hashtags: string[];
  onAccept: () => void;
  onReject: () => void;
  status?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ image, content, hashtags, onAccept, onReject }) => (
  <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-xl">
    <img src={image} alt="Generated Content" className="w-full h-48 object-cover" />
    <div className="p-5 space-y-4">
      <p className="font-['Merriweather'] text-slate-800 text-sm leading-relaxed">{content}</p>
      <div className="flex flex-wrap gap-2">
        {hashtags.map(tag => (
          <span key={tag} className="text-xs font-['Montserrat'] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            #{tag}
          </span>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onAccept} className="flex-1 bg-slate-900 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors">
          <Check size={18} /> Accept
        </button>
        <button onClick={onReject} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <X size={18} /> Reject
        </button>
      </div>
    </div>
  </div>
);

export default ResultCard;