import React, { useState } from 'react';
import { Mail, MapPin, Send, MessageSquare, ArrowRight } from 'lucide-react';
import Footer from '../components/landingpage/Footer';

const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Save a hard reference to the form BEFORE the async pause
    const form = e.currentTarget; 
    const formData = new FormData(form);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert("Message sent! We'll get back to you shortly.");
        
        // 2. Use the saved reference to reset the form
        form.reset(); 
        
      } else {
        alert("Something went wrong. Please try again.");
        console.error("Web3Forms Error:", data);
      }
    } catch (error) {
      alert("Network error. Please check your connection and try again.");
      console.error("Submission Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#fafafa]">
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center py-30 px-6 relative z-10">
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-200/40 to-pink-200/40 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
          
          {/* Left Side: Contact Info */}
          <div className="flex flex-col justify-center">
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 mb-6 font-['Handlee'] tracking-tight">
              Get in <span className="bg-gradient-to-r from-[#FF4B8B] to-[#8E75C2] bg-clip-text text-transparent font-['Handlee']">touch.</span>
            </h1>
            
            <p className="text-lg text-slate-500 mb-12 font-['Montserrat'] leading-relaxed max-w-md">
              Have a question about VinciFlow, need custom enterprise pricing, or just want to say hi? Drop us a message and our team will get back to you within 24 hours.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-[#FF6B4A]">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-['Montserrat']">Email Us</h3>
                  <p className="text-slate-500 mt-1">hello@vinciflowapp.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-[#00C2FF]">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-['Montserrat']">Headquarters</h3>
                  <p className="text-slate-500 mt-1">Nashik, Maharashtra<br/>India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="bg-white/80 backdrop-blur-xl mt-15 p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-['Montserrat']" action="https://api.web3forms.com/submit" method="POST">
  
            {/* Required for Web3Forms */}
            <input type="hidden" name="access_key" value="5d77f57d-686e-4226-ba4e-e7dccd2362c8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="text-sm font-bold text-slate-700">First Name</label>
                <input 
                    type="text" 
                    id="firstName" 
                    name="first_name" /* <--- CRITICAL for Web3Forms */
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8E75C2]/50 transition-all placeholder:text-slate-400"
                    placeholder="John"
                />
                </div>
                <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="text-sm font-bold text-slate-700">Last Name</label>
                <input 
                    type="text" 
                    id="lastName" 
                    name="last_name" /* <--- CRITICAL */
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8E75C2]/50 transition-all placeholder:text-slate-400"
                    placeholder="Doe"
                />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-bold text-slate-700">Work Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" /* <--- CRITICAL */
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8E75C2]/50 transition-all placeholder:text-slate-400"
                    placeholder="john@company.com"
                />
                </div>
                
                {/* NEW PHONE NUMBER FIELD */}
                <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="text-sm font-bold text-slate-700">Phone Number</label>
                <input 
                    type="tel" 
                    id="phone" 
                    name="phone" /* <--- CRITICAL */
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8E75C2]/50 transition-all placeholder:text-slate-400"
                    placeholder="+91 0000000000"
                />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-bold text-slate-700">Message</label>
                <textarea 
                id="message" 
                name="message" /* <--- CRITICAL */
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8E75C2]/50 transition-all placeholder:text-slate-400 resize-none"
                placeholder="How can we help you?"
                />
            </div>

            <button 
                type="submit" 
                disabled={isSubmitting}
                className="group w-full mt-4 flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Sending...' : 'Send Message'}
                {!isSubmitting && <Send size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />}
            </button>

            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;