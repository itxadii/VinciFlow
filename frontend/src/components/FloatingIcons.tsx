import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook, Send } from 'lucide-react';

const FloatingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#f9f9f8]">
      {/* 1. Background Gradients (The "Aura" Blobs) */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-pink-200/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px]" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/20 rounded-full blur-[100px]" />

      {/* 2. Floating Icons (Hidden on Mobile for clean UI) */}
      <motion.div 
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute top-32 left-[12%] text-pink-400/20 hidden lg:block"
      >
        <Instagram size={100} strokeWidth={1} />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -8, 0] }} 
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute bottom-48 left-[10%] text-blue-400/30 hidden lg:block"
      >
        <Twitter size={80} strokeWidth={1} />
      </motion.div>

      <motion.div 
        animate={{ y: [0, -40, 0], rotate: [0, 3, 0] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute top-1/2 right-[8%] text-indigo-500/20 hidden lg:block"
      >
        <Facebook size={110} strokeWidth={1} />
      </motion.div>

      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.3, 0.2] }} 
        transition={{ duration: 4, repeat: Infinity }} 
        className="absolute bottom-24 right-[12%] text-purple-400/20 hidden lg:block"
      >
        <Send size={150} strokeWidth={0.5} />
      </motion.div>
    </div>
  );
};

export default FloatingBackground;