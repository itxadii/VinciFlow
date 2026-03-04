import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import { saveBrandProfile } from '../../services/brandApi';
import { Upload, CheckCircle2, ChevronLeft } from 'lucide-react';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // FIX: Match DynamoDB and Interface exactly
    BrandName: '',
    Industry: 'SaaS',
  Region: 'India',
    Tone: '', 
    Colors: ['#8E75C2'],
    Platforms: ['Instagram'],
    LogoUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 1. Auth Guard: Ensure only logged in users see this
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
      } catch (err) {
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // FIX: Use PascalCase key LogoUrl
      setFormData({ ...formData, LogoUrl: `s3://vinciflow-assets/${file.name}` });
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Data ab sahi format mein save hoga
      await saveBrandProfile(formData);
      // Success ke baad direct Connect-X page par redirect
      navigate('/connect-x', { replace: true }); 
    } catch (error) {
      console.error("Setup failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 font-['Montserrat'] overflow-hidden bg-[#fdf2f8]">
      {/* Branding Header */}
      <span className="absolute top-10 left-10 text-4xl font-bold text-slate-800 font-['Handlee']">
        VinciFlow
      </span>

      {/* Decorative Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-200/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/50 blur-[120px]" />
      </div>

      {/* Glassmorphism Card */}
      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 p-12 rounded-[2.5rem] shadow-2xl max-w-2xl w-full relative z-10">
        
        {/* Progress Stepper */}
        <div className="flex items-center gap-4 mb-10">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
          )}
          <div className="flex gap-2 flex-1">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-slate-800' : 'bg-slate-200/50'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: The Foundation */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
              <h2 className="text-4xl font-['Merriweather'] font-bold text-slate-800">The Foundation</h2>
              <p className="font-['Handlee'] text-slate-400 mt-2">Let's define the core of your brand.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand Name</label>
                <input 
                  className="w-full p-4 mt-1 bg-white/40 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-700" 
                  placeholder="e.g. VinciFlow AI"
                  value={formData.BrandName} // FIX: PascalCase
                  onChange={e => setFormData({...formData, BrandName: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Industry</label>
                <select 
                  className="w-full p-4 mt-1 bg-white/40 border border-slate-200 rounded-2xl cursor-pointer font-bold text-slate-700" 
                  value={formData.Industry} // FIX: PascalCase
                  onChange={e => setFormData({...formData, Industry: e.target.value})}
                >
                  <option>SaaS</option><option>Fashion</option><option>Food</option><option>Tech</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Region</label>
                <select 
                  className="w-full p-4 mt-1 bg-white/40 border border-slate-200 rounded-2xl cursor-pointer font-bold text-slate-700"
                  value={formData.Region} // FIX: PascalCase
                  onChange={e => setFormData({...formData, Region: e.target.value})}
                >
                  <option>India</option><option>US</option><option>Global</option>
                </select>
              </div>
            </div>
            <button 
              disabled={!formData.BrandName}
              onClick={() => setStep(2)} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Visual DNA */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
              <h2 className="text-4xl font-['Merriweather'] font-bold text-slate-800">Visual DNA</h2>
              <p className="font-['Handlee'] text-slate-400 mt-2">Aura is expressed through colors and logos.</p>
            </div>

            <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-200 rounded-4xl bg-white/30 hover:bg-white/50 relative">
              <div className="p-4 bg-white rounded-2xl shadow-sm"><Upload className="text-slate-400" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">Upload Brand Logo</p>
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLogoUpload} />
              </div>
              {formData.LogoUrl && <CheckCircle2 className="text-green-500" size={20} />}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Brand Color</label>
              <div className="flex gap-4 mt-3">
                <input 
                  type="color" 
                  className="w-16 h-16 rounded-xl cursor-pointer bg-transparent" 
                  value={formData.Colors[0]} 
                  onChange={e => setFormData({...formData, Colors: [e.target.value]})} 
                />
                <div className="flex-1 flex flex-col justify-center px-4 bg-white/30 border border-slate-200 rounded-2xl">
                  <span className="font-mono font-bold text-slate-700 uppercase">{formData.Colors[0]}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(3)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl">Set Visuals</button>
          </div>
        )}

        {/* Step 3: The Vibe */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
              <h2 className="text-4xl font-['Merriweather'] font-bold text-slate-800">The Vibe</h2>
              <p className="font-['Handlee'] text-slate-400 mt-2">Define your voice for the AI Agent.</p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Tone & Aura</label>
              <textarea 
                className="w-full p-4 mt-2 bg-white/30 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200 h-32 resize-none font-medium" 
                placeholder="Describe your voice: e.g. Professional yet witty..."
                value={formData.Tone} // FIX: PascalCase
                onChange={e => setFormData({...formData, Tone: e.target.value})}
              />
            </div>

            <button 
              disabled={!formData.Tone || isSubmitting}
              onClick={handleFinish} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Synthesizing...' : 'Initialize Aura'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;