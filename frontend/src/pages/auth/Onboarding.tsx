import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveBrandProfile } from '../../services/brandApi';
import { Upload, CheckCircle2, ChevronLeft } from 'lucide-react';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    brandName: '',
    industry: 'SaaS',
    region: 'India',
    tone: '', 
    colors: ['#8E75C2'],
    platforms: ['Instagram'],
    logoUrl: ''
  });
  const navigate = useNavigate();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logoUrl: `s3://vinciflow-assets/${file.name}` });
    }
  };

  const handleFinish = async () => {
    try {
      await saveBrandProfile(formData);
      // Seedha chat ke bajaye integration page par bhej rahe hain
      navigate('/connect-x'); 
    } catch (error) {
      console.error("Setup failed:", error);
    }
  };

  return (
    /* 1. Main Wrapper with VinciFlow Grainy Gradient */
    <div className="relative min-h-screen flex items-center justify-center p-6 font-['Montserrat'] overflow-hidden bg-[#fdf2f8]">
      <span className="absolute top-10 left-10 text-4xl font-bold text-slate-800 font-['Handlee']">
  VinciFlow
</span>
      {/* 2. The Gradient Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-200/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/50 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-yellow-100/60 blur-[100px]" />
      </div>

      {/* 3. The Grain Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 4. The Glassmorphism Card */}
      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 p-12 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] max-w-2xl w-full relative z-10 overflow-hidden">
        
        {/* Progress & Back Navigation */}
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
                  value={formData.brandName}
                  onChange={e => setFormData({...formData, brandName: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Industry</label>
                <select 
                  className="w-full p-4 mt-1 bg-white/40 border border-slate-200 rounded-2xl cursor-pointer font-bold text-slate-700" 
                  value={formData.industry}
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                >
                  <option>SaaS</option><option>Fashion</option><option>Food</option><option>Tech</option><option>Fitness</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Region</label>
                <select 
                  className="w-full p-4 mt-1 bg-white/40 border border-slate-200 rounded-2xl cursor-pointer font-bold text-slate-700"
                  value={formData.region}
                  onChange={e => setFormData({...formData, region: e.target.value})}
                >
                  <option>India</option><option>US</option><option>Global</option>
                </select>
              </div>
            </div>
            <button 
              disabled={!formData.brandName}
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
            <div>
              <h2 className="text-4xl font-['Merriweather'] font-bold text-slate-800">Visual DNA</h2>
              <p className="font-['Handlee'] text-slate-400 mt-2">Aura is expressed through colors and logos.</p>
            </div>

            <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-200 rounded-4xl bg-white/30 hover:bg-white/50 transition-colors relative">
              <div className="p-4 bg-white rounded-2xl shadow-sm"><Upload className="text-slate-400" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">Upload Brand Logo</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">PNG or SVG preferred</p>
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLogoUpload} />
              </div>
              {formData.logoUrl && <CheckCircle2 className="text-green-500" size={20} />}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Brand Color</label>
              <div className="flex gap-4 mt-3">
                <input 
                  type="color" 
                  className="w-16 h-16 rounded-xl cursor-pointer border-none bg-transparent" 
                  value={formData.colors[0]} 
                  onChange={e => setFormData({...formData, colors: [e.target.value]})} 
                />
                <div className="flex-1 flex flex-col justify-center px-4 bg-white/30 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-black text-slate-300 uppercase">Hex Code</span>
                  <span className="font-mono font-bold text-slate-700 uppercase">{formData.colors[0]}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(3)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl">Set Visuals</button>
          </div>
        )}

        {/* Step 3: The Vibe (Tone & Platforms) */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-4xl font-['Merriweather'] font-bold text-slate-800">The Vibe</h2>
              <p className="font-['Handlee'] text-slate-400 mt-2">Define your voice for the AI to synthesize.</p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand Tone & Aura Description</label>
              <textarea 
                className="w-full p-4 mt-2 bg-white/30 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200 h-32 resize-none font-medium text-slate-700 placeholder:text-slate-400" 
                placeholder="Describe your voice: e.g. Witty and bold, yet technically authoritative with a touch of luxury..."
                value={formData.tone}
                onChange={e => setFormData({...formData, tone: e.target.value})}
              />
            </div>

            <div className="p-6 bg-slate-900 rounded-4xl text-white flex justify-between items-center group">
              <div>
                <p className="font-['Handlee'] text-xl">Active Platform</p>
                <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold group-hover:opacity-100 transition-opacity">V1: Instagram Exclusive</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl"><CheckCircle2 className="text-green-400" /></div>
            </div>

            <button 
              disabled={!formData.tone}
              onClick={handleFinish} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              Initialize Aura
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;