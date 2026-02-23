import React from 'react';

const ResponseLoader: React.FC = () => {
  return (
    <div className="flex justify-start my-4 items-center">
      <div 
        className="w-8 h-8 rounded-full animate-spin shadow-sm" 
        style={{
          background: 'conic-gradient(#FF4B8B 0% 25%, #8E75C2 25% 50%, #00C2FF 50% 75%, #FFD700 75% 100%)',
          maskImage: 'radial-gradient(circle, transparent 65%, black 65%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 65%, black 65%)'
        }}
      />
      <span className="ml-3 text-xs font-['Handlee'] text-slate-400 self-center animate-pulse">
        VinciFlow is weaving magic...
      </span>
    </div>
  );
};

export default ResponseLoader;