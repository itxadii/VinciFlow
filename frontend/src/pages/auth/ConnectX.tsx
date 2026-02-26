// src/pages/auth/ConnectX.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Twitter, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/api'; // Aapka authenticated client

const ConnectX: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleXAuth = async () => {
    setLoading(true);
    try {
      /** * AUTHENTICATED CALL: 
       * Ye call headers ke saath jayegi, isliye 401 nahi aayega.
       */
      const response = await apiClient.get('/auth/x');
      
      if (response.data.authUrl) {
        // Ab hum X (Twitter) ke actual auth page par redirect karenge
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error("X Auth Link generation failed:", error);
      alert("Aura Connection Failed. Check if Lambda is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 font-['Montserrat'] overflow-hidden bg-[#fdf2f8]">
      {/* VinciFlow Blobs & Grain Overlay (Same as before) */}
      
      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 p-12 rounded-[2.5rem] shadow-2xl max-w-xl w-full relative z-10 text-center">
        <h2 className="text-4xl font-['Merriweather'] font-bold text-slate-800 mb-4">Grant Wings to Your AI</h2>
        
        <button 
          onClick={handleXAuth}
          disabled={loading}
          className="w-full py-5 bg-black text-white rounded-2xl font-bold shadow-xl hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Twitter fill="white" />}
          {loading ? "Generating Link..." : "Connect X (Twitter)"}
        </button>

        <button onClick={() => navigate('/chat')} className="mt-8 text-slate-400 text-sm font-bold uppercase hover:text-slate-600">
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default ConnectX;