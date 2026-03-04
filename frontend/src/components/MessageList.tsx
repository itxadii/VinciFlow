import React from 'react';
import ResponseLoader from './ResponseLoader'; 
import type { Message } from '../types/chat';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  // FIX: Type aligned with parent nullability
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, scrollRef }) => {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:px-24 space-y-10 custom-scrollbar z-10">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* 1. Empty State with Branding Fonts */}
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center mt-20">
            <span className="text-6xl mb-4">🎨</span>
            <p className="font-['Handlee'] text-2xl text-slate-600">
              Start your creative flow...
            </p>
          </div>
        )}

        {/* 2. Message Mapping */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] transition-all duration-300 ${
              msg.role === 'user' 
                ? 'bg-[#E2E8F0]/80 backdrop-blur-sm text-slate-800 rounded-2xl px-5 py-3 shadow-sm font-["Montserrat"] font-medium' // User Message
                : 'text-slate-800 font-["Merriweather"] font-light text-[17px] leading-[1.7]' // Assistant Message
            }`}>
              <p className="whitespace-pre-wrap select-text">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {/* 3. Your Custom Loader integration */}
        {isLoading && <ResponseLoader />}

        {/* 4. Anchor for Auto-scroll */}
        <div ref={scrollRef} className="h-24" />
      </div>
    </main>
  );
};

export default MessageList;