import React from 'react';
import ResponseLoader from './ResponseLoader'; 
import type { Message } from '../types/chat';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  isGeneratingFlow: boolean; // ✅ proper type, not JSX
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, scrollRef, isGeneratingFlow }) => { // ✅ destructured
  return (
    <main className="flex-1 overflow-y-auto p-4 md:px-10 space-y-10 custom-scrollbar z-10">
      <div className="max-w-4xl mx-auto space-y-10 pt-10">
        
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center mt-20">
            <span className="text-6xl mb-4">🎨</span>
            <p className="font-['Handlee'] text-2xl text-slate-600">
              Start your creative flow...
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] transition-all duration-300 ${
                msg.role === "user"
                  ? "bg-gray-200 text-slate-800 rounded-2xl rounded-tr-none px-5 py-3 shadow-sm font-['Montserrat'] font-medium"
                  : "text-slate-800 font-['Merriweather'] font-light text-[17px] leading-[1.7]"
              }`}
            >
              <p className="whitespace-pre-wrap wrap-break-words select-text">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {/* ✅ isGeneratingFlow now correctly passed to loader */}
        {isLoading && <ResponseLoader isGenerating={isGeneratingFlow} />}

        <div ref={scrollRef} /> {/* ✅ scrollRef was never used — add this */}
      </div>
    </main>
  );
};

export default MessageList;