import React from 'react';
import { 
  Settings, 
  Sparkles, 
  Layout, 
  CalendarClock, 
  Send, 
  PartyPopper, 
  Check 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
    <section className="relative flex flex-col items-center justify-center bg-transparent py-20 px-4 md:px-8 lg:px-16">
      
      {/* TOP BLOCK: Visual Cluster (MVP Features) */}
      <div className="relative w-full max-w-5xl h-[350px] md:h-[450px] mb-8">
        
        {/* SVG Connecting Lines */}
        <svg 
          className="absolute inset-0 h-full w-full pointer-events-none z-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <g stroke="#cbd5e1" strokeWidth="1.5" fill="none">
            {/* --- Left Side Paths --- */}
            <path d="M 50 50 L 10 50" vectorEffect="non-scaling-stroke" />
            <path d="M 30 50 L 23 25 L 20 25" vectorEffect="non-scaling-stroke" />
            <path d="M 30 50 L 23 75 L 20 75" vectorEffect="non-scaling-stroke" />
            
            {/* Left Purple Joint Dots */}
            <circle cx="23" cy="25" r="0.8" fill="#a855f7" stroke="none" />
            <circle cx="23" cy="75" r="0.8" fill="#a855f7" stroke="none" />

            {/* --- Right Side Paths --- */}
            <path d="M 50 50 L 90 50" vectorEffect="non-scaling-stroke" />
            <path d="M 70 50 L 77 25 L 80 25" vectorEffect="non-scaling-stroke" />
            <path d="M 70 50 L 77 75 L 80 75" vectorEffect="non-scaling-stroke" />
            
            {/* Right Purple Joint Dots */}
            <circle cx="77" cy="25" r="0.8" fill="#a855f7" stroke="none" />
            <circle cx="77" cy="75" r="0.8" fill="#a855f7" stroke="none" />
          </g>
        </svg>

        {/* --- CENTRAL NODE (The Core) --- */}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 h-28 w-28 rounded-[2rem] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-2xl flex items-center justify-center border-[5px] border-white backdrop-blur-md">
          <Check size={48} strokeWidth={4} className="text-white" />
        </div>

        {/* --- LEFT SIDE NODES --- */}
        <div className="absolute left-[10%] top-[50%] z-10 -translate-x-1/2 -translate-y-1/2 h-20 w-20 md:w-auto md:px-6 rounded-[1.5rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-400 flex items-center justify-center gap-3 transition-all">
          <Settings size={26} className="text-gray-700 shrink-0" />
          <span className="hidden md:block font-bold text-gray-700 text-lg tracking-tight font-['Handlee']">Setup</span>
        </div>
        
        <div className="absolute left-[20%] top-[25%] z-10 -translate-x-1/2 -translate-y-1/2 h-14 w-14 md:w-auto md:px-5 rounded-2xl bg-[#ffdf6b] shadow-lg border border-gray-400 flex items-center justify-center gap-2 transition-all">
          <Sparkles size={20} strokeWidth={2.5} className="text-gray-800 shrink-0" />
          <span className="hidden md:block font-bold text-gray-800 text-lg tracking-tight font-['Handlee']">Generate</span>
        </div>

        <div className="absolute left-[20%] top-[75%] z-10 -translate-x-1/2 -translate-y-1/2 h-14 w-14 md:w-auto md:px-5 rounded-2xl bg-[#45c4ff] shadow-lg border border-gray-400 flex items-center justify-center gap-2 transition-all">
          <Layout size={20} strokeWidth={2.5} className="text-white shrink-0" />
          <span className="hidden md:block font-bold text-white text-lg tracking-tight font-['Handlee']">Preview</span>
        </div>

        {/* --- RIGHT SIDE NODES --- */}
        <div className="absolute left-[90%] top-[50%] z-10 -translate-x-1/2 -translate-y-1/2 h-20 w-20 md:w-auto md:px-6 rounded-[1.5rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-400 flex items-center justify-center gap-3 transition-all">
          <CalendarClock size={26} className="text-gray-700 shrink-0" />
          <span className="hidden md:block font-bold text-gray-700 text-lg tracking-tight font-['Handlee']">Schedule</span>
        </div>

        <div className="absolute left-[80%] top-[25%] z-10 -translate-x-1/2 -translate-y-1/2 h-14 w-14 md:w-auto md:px-5 rounded-2xl bg-[#ff6b4a] shadow-lg border border-gray-400 flex items-center justify-center gap-2 transition-all">
          <Send size={20} strokeWidth={2.5} className="text-white shrink-0" />
          <span className="hidden md:block font-bold text-white text-lg tracking-tight font-['Handlee']">Publish</span>
        </div>

        <div className="absolute left-[80%] top-[75%] z-10 -translate-x-1/2 -translate-y-1/2 h-14 w-14 md:w-auto md:px-5 rounded-2xl bg-white shadow-lg border border-gray-400 flex items-center justify-center gap-2 transition-all">
          <PartyPopper size={20} strokeWidth={2.5} className="text-[#a855f7] shrink-0" />
          <span className="hidden md:block font-bold text-gray-700 text-lg tracking-tight font-['Handlee']">Festivals</span>
        </div>

      </div>

      {/* BOTTOM BLOCK: Main Text Content */}
      <div className="relative z-10 flex max-w-4xl flex-col items-center text-center">

        <h1 className=" text-4xl font-extrabold tracking-tight text-[#555555] md:text-7xl font-['Merriweather']">
          Create <span className="bg-gradient-to-r from-[#FF4B8B] via-[#8E75C2] to-[#00C2FF] bg-clip-text text-transparent font-['Handlee']">30 days</span> 
          <br/> of content
          <span className="bg-gradient-to-r from-[#FF4B8B] via-[#8E75C2] to-[#00C2FF] bg-clip-text text-transparent font-['Handlee']"> in 5 minutes.</span>
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto font-['Merriweather']">
          VinciFlow creates branded posts for you and publishes them automatically — no manual work, no creative block.
        </p>
        
        <span className="relative z-10 flex items-center gap-2 font-['Handlee'] mt-5">
          <button onClick={() => navigate('/signup')} className="flex items-center justify-center gap-2 px-10 py-5 backdrop-blur-sm text-slate-900 border-2 border-white rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-lg bg-yellow-100">
            Start Free
            {/* The SVG path is now properly wrapped inside an SVG tag */}
            <svg className="ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </span>
        <section className="flex justify-center items-center py-10 px-4">
          <div className="max-w-2xl w-full text-center">
            <span className="font-serif text-[120px] leading-none text-gray-200 block select-none">
              &ldquo;
            </span>
            <p className="font-serif text-3xl md:text-4xl italic font-normal leading-relaxed tracking-tight text-gray-900">
              Built for{" "}
              <span className="not-italic font-semibold">D2C brands</span>,
              founders &amp; creators who post{" "}
              <span className="not-italic font-semibold">daily</span>
            </p>
            <div className="w-10 h-0.5 bg-gray-400 mx-auto mt-8 rounded-full" />
          </div>
        </section>
      </div>

    </section>
    </>
  );
};

export default HeroSection;