import React, { useState } from 'react';
import { confirmSignUp } from 'aws-amplify/auth';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import FloatingIcons from '../../components/FloatingIcons'; // Path check kar lena bhai

export default function ConfirmAccount() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      navigate('/login?confirmed=true');
    } catch (err) {
      alert("Invalid code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Background matches the global Aura theme */
    <div className="relative min-h-screen bg-[#f9f9f8] flex flex-col justify-center items-center px-6 overflow-hidden">
      
      {/* 1. Global Floating Background Layers */}
      <FloatingIcons />

      {/* 2. Verification Card with Glassmorphism */}
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 text-center">
          
          <div className="mb-8">
            {/* Branding: Handlee Font */}
            <h2 className="text-5xl font-bold text-slate-800 font-['Handlee'] mb-3 tracking-tight">
              VinciFlow
            </h2>
            <p className="font-['Merriweather'] font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">
              Verify Your Email
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-8">
            <p className="font-['Merriweather'] text-sm text-slate-600 leading-relaxed">
              We've sent a 6-digit synthesis code to <br />
              <span className="text-blue-600 font-bold">{email}</span>
            </p>

            <div className="group font-['Montserrat']">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Verification Code</label>
              <input 
                type="text" 
                placeholder="000000" 
                maxLength={6}
                /* Large tracking for a pro 'code entry' look */
                className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-white/40 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <button 
              disabled={loading || code.length < 6}
              /* Sleek small button style */
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-['Merriweather'] font-bold text-sm hover:bg-black shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Launch Flow"}
            </button>
          </form>

          <div className="mt-8">
            <button 
              onClick={() => navigate('/signup')}
              className="text-xs font-['Merriweather'] font-bold text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-4"
            >
              Wait, I used the wrong email
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="mt-8 z-10">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">
          Finalizing Identity Orchestration • v1.0
        </p>
      </div>
    </div>
  );
}