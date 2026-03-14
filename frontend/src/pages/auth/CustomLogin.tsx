import React, { useState, useEffect } from 'react';
import { signIn, getCurrentUser } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import FloatingIcons from '../../components/FloatingIcons';

export default function CustomLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // ✅ Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigateBasedOnBrand = async () => {
    navigate('/chat', { replace: true });
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        await navigateBasedOnBrand();
      } catch (err) {
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) await navigateBasedOnBrand();
    } catch (err: any) {
      setError(err.message || "Login failed. Check your credentials.");
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center">
        <div className="animate-pulse font-['Handlee'] text-slate-400">Verifying session & brand aura...</div>
      </div>
    );
  }

  // ✅ Mobile block screen
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 font-['Handlee'] mb-3">
            VinciFlow
          </h2>
          <p className="font-['Merriweather'] font-bold text-slate-700 text-base mb-2">
            Desktop only for now
          </p>
          <p className="font-['Montserrat'] text-slate-400 text-sm leading-relaxed">
            VinciFlow is optimized for desktop and laptop screens. Please open it on your PC or Mac for the full experience.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl px-6 py-4 w-full max-w-xs">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-1">Coming Soon</p>
          <p className="text-sm font-['Merriweather'] font-bold text-slate-500">Mobile app in the works ✦</p>
        </div>

        <p className="mt-10 text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">
          Powered by VinciFlow Engine v1.0
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-6 overflow-hidden bg-[#f9f9f8]">
      <FloatingIcons />

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/30">
          
          <div className="text-center mb-10">
            <h2 className="text-5xl font-bold text-slate-800 font-['Handlee'] mb-3 tracking-tight">
              VinciFlow
            </h2>
            <p className="font-['Merriweather'] font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">
              Sign in to your AI workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}
            
            <div className="space-y-4 font-['Montserrat']">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none transition-all font-bold text-slate-700 focus:ring-2 focus:ring-[#8E75C2]/20"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none transition-all font-bold text-slate-700 focus:ring-2 focus:ring-[#8E75C2]/20"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-['Merriweather'] font-bold text-sm hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/10"
            >
              Enter Workspace
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-['Merriweather'] font-bold text-slate-400">
            New here? <Link to="/signup" className="text-blue-600 underline underline-offset-4 decoration-2">Create Account</Link>
          </p>
        </div>
      </div>
      
      <div className="mt-8 z-10">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">
          Powered by VinciFlow Engine v1.0
        </p>
      </div>
    </div>
  );
}