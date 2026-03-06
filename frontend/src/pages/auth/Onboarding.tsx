import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import { saveBrandProfile } from '../../services/brandApi';
import { Upload, CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // --- Brand State (Matching DynamoDB PascalCase) ---
  const [formData, setFormData] = useState({
    BrandName: '',
    Industry: 'SaaS',
    Region: 'India',
    Tone: '', 
    Colors: ['#8E75C2'],
    Platforms: ['Twitter'],
    LogoUrl: '',         // Final S3 URL will be stored here
    logoBase64: '',      // Used for Lambda-to-S3 transfer
    contentType: ''      // For correct S3 metadata
  });

  // 1. Auth Guard
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

  // 2. Base64 Helper for S3 Upload
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // SVG, PNG, JPG validation
      if (!['image/svg+xml', 'image/png', 'image/jpeg'].includes(file.type)) {
        toast.error("Please upload an SVG, PNG, or JPG file.");
        return;
      }

      try {
        const base64 = await convertToBase64(file);
        setFormData({ 
          ...formData, 
          logoBase64: base64, 
          contentType: file.type,
          LogoUrl: file.name 
        });
        toast.success("Logo processed! 🎨");
      } catch (err) {
        toast.error("Failed to process image.");
      }
    }
  };

  const handleFinish = async () => {
    if (!formData.Tone) return;
    setIsSubmitting(true);
    
    try {
      // Sending full payload to Lambda
      await saveBrandProfile(formData);
      toast.success("Aura Initialized! 🚀");
      
      // Redirecting to X integration page
      navigate('/connect-x', { replace: true }); 
    } catch (error) {
      console.error("Setup failed:", error);
      toast.error("Failed to save brand profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 font-['Montserrat'] overflow-hidden bg-[#fdf2f8]">
      {/* VinciFlow Header */}
      <span className="absolute top-10 left-10 text-4xl font-bold text-slate-800 font-['Handlee']">
        VinciFlow
      </span>

      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-200/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/50 blur-[120px]" />
      </div>

      {/* Main Form Card */}
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
            <div>
              <h2 className="text-4xl font-['Merriweather'] font-bold text-slate-800">The Foundation</h2>
              <p className="font-['Handlee'] text-slate-400 mt-2">Let's define your brand's core identity.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand Name</label>
                <input 
                  className="w-full p-4 mt-1 bg-white/40 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-700 placeholder:text-slate-300" 
                  placeholder="e.g. VinciFlow AI"
                  value={formData.BrandName}
                  onChange={e => setFormData({...formData, BrandName: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Industry</label>
                <select 
                  className="w-full p-4 mt-1 bg-white/40 border border-slate-200 rounded-2xl cursor-pointer font-bold text-slate-700" 
                  value={formData.Industry}
                  onChange={e => setFormData({...formData, Industry: e.target.value})}
                >
                  <option>SaaS</option><option>Fashion</option><option>Food</option><option>Tech</option><option>Fitness</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Region</label>
                <select 
                  className="w-full p-4 mt-1 bg-white/40 border border-slate-200 rounded-2xl cursor-pointer font-bold text-slate-700"
                  value={formData.Region}
                  onChange={e => setFormData({...formData, Region: e.target.value})}
                >
                  <option>India</option><option>US</option><option>Europe</option><option>Global</option>
                </select>
              </div>
            </div>
            <button 
              disabled={!formData.BrandName}
              onClick={() => setStep(2)} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              Continue to Visuals
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

            {/* Logo Upload Box */}
            <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-white/30 hover:bg-white/50 relative group transition-all">
              {formData.logoBase64 ? (
                <img src={formData.logoBase64} alt="Preview" className="w-16 h-16 object-contain rounded-xl" />
              ) : (
                <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><Upload className="text-slate-400" /></div>
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">
                  {formData.LogoUrl ? `File: ${formData.LogoUrl}` : "Upload Brand Logo"}
                </p>
                <p className="text-xs text-slate-400">SVG, PNG, or JPG (Max 5MB)</p>
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLogoUpload} accept=".svg,.png,.jpg,.jpeg" />
              </div>
              {formData.logoBase64 && <CheckCircle2 className="text-green-500" size={20} />}
            </div>

            {/* Color Picker */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Brand Color</label>
              <div className="flex gap-4 mt-3">
                <input 
                  type="color" 
                  className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-none" 
                  value={formData.Colors[0]} 
                  onChange={e => setFormData({...formData, Colors: [e.target.value]})} 
                />
                <div className="flex-1 flex flex-col justify-center px-4 bg-white/40 border border-slate-200 rounded-2xl">
                  <span className="font-mono font-bold text-slate-700 uppercase tracking-tighter">{formData.Colors[0]}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-black">Hex Code</span>
                </div>
              </div>
            </div>

            <button onClick={() => setStep(3)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
              Define the Vibe
            </button>
          </div>
        )}

        {/* Step 3: The Vibe */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-['Merriweather'] font-bold text-slate-800">The Vibe</h2>
                <p className="font-['Handlee'] text-slate-400 mt-2">Define your voice for the AI Agent.</p>
              </div>
              <Sparkles className="text-slate-800 animate-pulse" size={32} />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Tone & Aura</label>
              <textarea 
                className="w-full p-4 mt-2 bg-white/30 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200 h-40 resize-none font-medium text-slate-700" 
                placeholder="Describe your brand's voice. e.g., 'Professional but witty, focusing on high-tech fashion and minimalist aesthetics...'"
                value={formData.Tone}
                onChange={e => setFormData({...formData, Tone: e.target.value})}
              />
            </div>

            <button 
              disabled={!formData.Tone || isSubmitting}
              onClick={handleFinish} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Synthesizing Aura...
                </>
              ) : 'Initialize Aura'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;