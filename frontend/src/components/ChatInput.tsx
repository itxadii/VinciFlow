import React, { useRef } from 'react';
import { Plus, ArrowUp } from 'lucide-react'; // Premium icons use kar rahe hain

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (e: React.FormEvent) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  input, setInput, onSend, selectedFile, setSelectedFile, isLoading 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <footer className="p-6 bg-[#f9f9f8]"> {/* Image ab0996 wala light gray bg */}
      <div className="max-w-3xl mx-auto relative">
        
        {/* File Preview Bubble */}
        {selectedFile && (
          <div className="absolute -top-10 left-4 flex items-center gap-2 bg-white text-slate-600 px-3 py-1 rounded-xl text-xs border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <span className="truncate max-w-37.5">📎 {selectedFile.name}</span>
            <button type="button" onClick={() => setSelectedFile(null)} className="font-bold hover:text-red-500">×</button>
          </div>
        )}

        <form 
          onSubmit={onSend} 
          className="bg-white border border-slate-200 rounded-[28px] shadow-sm focus-within:shadow-md transition-shadow px-4 py-3 flex flex-col gap-2"
        >
          {/* Main Input Area */}
          <div className="flex items-center gap-3">
            <input 
              type="file" ref={fileInputRef} className="hidden" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*,application/pdf"
            />
            
            {/* Plus Button for Uploads */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all active:scale-90"
            >
              <Plus size={22} />
            </button>

            <input
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="How can I help you today?"
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-slate-700 placeholder:text-slate-400 font-['Montserrat'] py-1"
            />
            
            {/* Minimalist Send Button */}
            <button 
              type="submit" 
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className={`p-2 rounded-full transition-all shadow-sm ${
                isLoading || (!input.trim() && !selectedFile)
                ? 'bg-slate-100 text-slate-300'
                : 'bg-slate-900 text-white hover:bg-black active:scale-95'
              }`}
            >
              <ArrowUp size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Bottom Row - Status/Model Info */}
          <div className="flex justify-end items-center px-2">
            <span className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">
              VinciFlow v1.0 • Nova Lite
            </span>
          </div>
        </form>
      </div>
    </footer>
  );
};

export default ChatInput;