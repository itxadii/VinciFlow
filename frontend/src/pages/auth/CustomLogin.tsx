import React, { useState, useEffect } from 'react';
import { signIn, getCurrentUser } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import FloatingIcons from '../../components/FloatingIcons';

export default function CustomLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true); // Loading state for auth check
  const navigate = useNavigate();

  // 1. Redirect logic: If already authenticated, go to chat
  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        // If successful, user is logged in, send to chat
        navigate('/chat', { replace: true }); 
      } catch (err) {
        // User not logged in, stay on login page
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        navigate('/chat');
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Check your credentials.");
    }
  };

  // Auth check ke waqt blank screen ya loader dikhana zaroori hai
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center">
        <div className="animate-pulse font-['Handlee'] text-slate-400">Verifying session...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-6 overflow-hidden bg-[#f9f9f8]">
      
      {/* 1. Global Floating Background Layers */}
      <FloatingIcons />

      {/* 2. Login Card with Glassmorphism */}
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
                className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700"
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