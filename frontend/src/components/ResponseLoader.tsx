import React from 'react';

interface ResponseLoaderProps {
  isGenerating?: boolean;
}

const ResponseLoader: React.FC<ResponseLoaderProps> = ({ isGenerating = false }) => {
  return (
    <div className="flex justify-start my-4 items-center">
      <div 
        className="w-8 h-8 rounded-full animate-spin shadow-sm shrink-0" 
        style={{
          background: 'conic-gradient(#FF4B8B 0% 25%, #8E75C2 25% 50%, #00C2FF 50% 75%, #FFD700 75% 100%)',
          maskImage: 'radial-gradient(circle, transparent 65%, black 65%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 65%, black 65%)'
        }}
      />
      <div className="ml-3 flex flex-col">
        <span className="text-xs font-['Handlee'] text-slate-400 animate-pulse">
          {isGenerating ? 'Generating post flow...' : 'VinciFlow is weaving magic...'}
        </span>
        {isGenerating && (
          <span className="text-[10px] text-slate-300 font-['Montserrat'] mt-0.5">
            Crafting caption · Generating image · Applying branding
          </span>
        )}
      </div>
    </div>
  );
};

export default ResponseLoader;