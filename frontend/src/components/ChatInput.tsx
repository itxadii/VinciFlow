import React, { useRef } from 'react';
import { Plus, ArrowUp, Paperclip } from 'lucide-react';

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
    <footer className="p-6 bg-[#f9f9f8]">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={onSend}
          className="bg-white border border-slate-200 rounded-[28px] shadow-sm focus-within:shadow-md transition-shadow px-4 py-3 flex flex-col gap-2"
        >
          {/* File Chip — inside the bar */}
          {selectedFile && (
            <div className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-[10px] text-xs max-w-[240px] min-w-0">
                <Paperclip size={12} className="shrink-0 text-slate-400" />
                <span className="truncate">{selectedFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-slate-300 hover:text-red-400 transition-colors text-base leading-none px-1"
              >
                ×
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*,application/pdf"
            />

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

          {/* Bottom Row */}
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