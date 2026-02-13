import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="max-w-7xl mx-auto text-center z-10 pt-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/20 text-sm font-semibold text-gray-600 mb-8 shadow-sm"
        >
          <Sparkles size={16} className="text-purple-500" />
          <span className="font-['Handlee']">Next-Gen AI Content Orchestration</span>
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-800 mb-8 leading-[0.9] font-sans ">
          Post <span className="font-['Handlee']">With</span> a <span className="bg-gradient-to-r from-[#FF4B8B] via-[#8E75C2] to-[#00C2FF] bg-clip-text text-transparent font-['Handlee']">Flow</span> <br /> 
          
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
          The engine that synthesizes high-impact posters and orchestrates 
          your social growth across all platforms instantly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={() => navigate('/login')}
            className="group relative px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            <span className="relative z-10 flex items-center gap-2 font-['Handlee']">
              Start Creating 
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#8E75C2] to-[#00C2FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          <span className="relative z-10 flex items-center gap-2 font-['Handlee']">
          <button className="px-10 py-5 backdrop-blur-sm text-slate-900 border-2 border-white rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-lg bg-yellow-50">
            See the Magic ✨
          </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;