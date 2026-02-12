import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook, Send } from 'lucide-react';

const FloatingIcons = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-pink-200/40 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px]" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/30 rounded-full blur-[100px]" />

      {/* Floating Icons with Motion */}
      <motion.div 
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute top-40 left-[10%] text-pink-500 opacity-40 hidden lg:block"
      >
        <Instagram size={80} strokeWidth={1.5} />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 25, 0], rotate: [0, -5, 0] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute bottom-40 left-[8%] text-blue-400 opacity-70 hidden lg:block"
      >
        <Twitter size={70} strokeWidth={1.5} />
      </motion.div>

      <motion.div 
        animate={{ y: [0, -30, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute top-60 right-[12%] text-indigo-600 opacity-40 hidden lg:block"
      >
        <Facebook size={90} strokeWidth={1.5} />
      </motion.div>

      <motion.div 
        animate={{ scale: [1, 1.1, 1] }} 
        transition={{ duration: 3, repeat: Infinity }} 
        className="absolute bottom-20 right-[15%] text-purple-500 opacity-40 hidden lg:block"
      >
        <Send size={120} strokeWidth={1} />
      </motion.div>
    </div>
  );
};

export default FloatingIcons;