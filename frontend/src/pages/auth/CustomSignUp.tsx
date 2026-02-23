import React, { useState } from 'react';
import { signUp } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import FloatingIcons from '../../components/FloatingIcons'; // Ensure path is correct

export default function CustomSignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    brandVoice: 'Professional' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    setError('');

    try {
      await signUp({
        username: formData.email, 
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            'custom:brand_voice': formData.brandVoice,
          },
        }
      });
      
      navigate(`/confirm?email=${encodeURIComponent(formData.email)}`);

    } catch (err: any) {
      console.error("Signup Error:", err);
      setError(err.message || "Signup failed. Try a stronger password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Background set to match your Aura theme */
    <div className="relative min-h-screen bg-[#f9f9f8] flex flex-col justify-center items-center px-6 py-12 overflow-hidden">
      
      {/* 1. Global Floating Background Layers */}
      <FloatingIcons />

      {/* 2. Sign Up Card with Glassmorphism */}
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
          
          <div className="text-center mb-8">
            {/* Title: Handlee Font for branding */}
            <h2 className="text-5xl font-bold text-slate-800 font-['Handlee'] mb-3 tracking-tight">
              Join VinciFlow
            </h2>
            <p className="font-['Merriweather'] font-bold text-slate-500 text-sm uppercase tracking-widest leading-relaxed">
              Start building your brand identity
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs py-3 px-4 rounded-xl text-center font-bold font-['Merriweather']">
                {error}
              </div>
            )}
            
            <div className="space-y-4 font-['Montserrat']">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Work Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full px-5 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:border-slate-300"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:border-slate-300"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:border-slate-300"
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Initial Brand Voice</label>
                <select 
                  className="w-full px-5 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-['Merriweather'] font-bold text-sm text-slate-600 appearance-none cursor-pointer"
                  onChange={(e) => setFormData({...formData, brandVoice: e.target.value})}
                >
                  <option value="Professional">Professional & Clean</option>
                  <option value="Witty">Witty & Humorous</option>
                  <option value="Bold">Bold & Aggressive</option>
                  <option value="Empathetic">Empathetic & Soft</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              /* Sleek small button logic */
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-['Merriweather'] font-bold text-sm hover:bg-black shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? "Creating Account..." : "Create Free Account"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-['Merriweather'] font-bold text-slate-400">
              Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-4">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Branding Footer */}
      <div className="mt-8 z-10">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">
          Engineered for Social Growth • v1.0
        </p>
      </div>
    </div>
  );
}