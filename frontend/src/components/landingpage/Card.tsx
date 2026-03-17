import React from 'react';
import { Instagram, RefreshCcw, Check, Sparkles, Calendar } from 'lucide-react';

const Card: React.FC = () => {
  return (
    <div className="relative w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 font-['Montserrat'] transition-transform duration-300 hover:-translate-y-1">
      
      {/* Top Badge / Status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
          <Instagram size={18} className="text-pink-500" />
          <span>Instagram Draft</span>
        </div>
        
        {/* Festival Killer Feature Badge */}
        <div className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-600 border border-purple-100">
          <Sparkles size={12} />
          Diwali Promo
        </div>
      </div>

      {/* Image Mockup Area */}
      <div className="relative mb-4 h-56 w-full overflow-hidden rounded-2xl bg-gray-100">
        {/* Placeholder for Skincare Image */}
        <img 
          src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop" 
          alt="Generated Skincare Post" 
          className="h-full w-full object-cover"
        />
        
        {/* Scheduled Time Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1.5 text-xs font-bold text-gray-800 shadow-sm">
          <Calendar size={14} className="text-[#FF6B4A]" />
          Oct 24, 10:00 AM
        </div>
      </div>

      {/* Generated Caption */}
      <div className="mb-6">
        <p className="mb-2 text-sm leading-relaxed text-gray-700">
          Glow bright this Diwali! ✨ Our new Vitamin C serum is the perfect addition to your festive prep. Get that radiant look naturally without the harsh chemicals. 🪔💛
        </p>
        <p className="text-xs font-semibold text-[#00C2FF]">
          #DiwaliReady #SkincareRoutine #FestiveGlow #CleanBeauty
        </p>
      </div>

      {/* Action Buttons (The core MVP loop) */}
      <div className="flex gap-3">
        {/* Reject/Regenerate Button */}
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200">
          <RefreshCcw size={16} />
          Regenerate
        </button>

        {/* Approve/Schedule Button */}
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4B8B] to-[#8E75C2] py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90">
          <Check size={18} strokeWidth={3} />
          Approve
        </button>
      </div>
      
    </div>
  );
};

export default Card;