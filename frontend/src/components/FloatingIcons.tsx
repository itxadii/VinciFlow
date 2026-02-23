import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook, Send } from 'lucide-react';

const FloatingIcons = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background Aura Blobs - Exactly as per landing page */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-pink-200/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px]" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/20 rounded-full blur-[100px]" />

      {/* Floating Icons with Motion */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute top-40 left-[10%] text-pink-400 opacity-30"
      >
        <Instagram size={100} strokeWidth={1} />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute bottom-40 left-[8%] text-blue-400 opacity-40"
      >
        <Twitter size={80} strokeWidth={1} />
      </motion.div>

      <motion.div 
        animate={{ y: [0, -30, 0] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute top-60 right-[12%] text-indigo-500 opacity-30"
      >
        <Facebook size={120} strokeWidth={0.5} />
      </motion.div>

      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ duration: 5, repeat: Infinity }} 
        className="absolute bottom-20 right-[15%] text-purple-500"
      >
        <Send size={150} strokeWidth={0.5} />
      </motion.div>
    </div>
  );
};

export default FloatingIcons;