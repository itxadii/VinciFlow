import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/landingpage/Footer';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#fafafa]">
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center pt-32 pb-24 px-6 relative z-10">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-b from-purple-200/30 to-transparent blur-[120px] pointer-events-none" />

        <div className="w-full max-w-3xl mx-auto font-['Montserrat'] relative">
          
          {/* Section 1: Simple Intro */}
          <section className="mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight font-[Handlee]">
              Why VinciFlow exists
            </h1>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-4">
              Creating content consistently is one of the hardest parts of running a brand. 
              Most founders either spend hours planning posts or stop posting completely.
            </p>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
              VinciFlow was built to solve that — generate, schedule, and publish content automatically.
            </p>
          </section>

          {/* Section 2: What it does */}
          <section className="mb-16 bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 font-[Merriweather]">
              What VinciFlow does
            </h2>
            <ul className="space-y-4 text-slate-600 text-lg font-medium">
              {[
                "Generates content ideas and captions",
                "Creates ready-to-post visuals",
                "Schedules posts for future dates",
                "Publishes automatically to your social accounts"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#00C2FF] shrink-0" size={24} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: Founder (VERY IMPORTANT) */}
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 font-[Merriweather]">
              Built by a student, for real brands
            </h2>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-4">
              VinciFlow is built by Aditya Waghmare, a Computer Science student focused on cloud, AI, and automation.
            </p>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
              The goal is simple — help brands grow without spending hours on content.
            </p>
          </section>

          {/* Section 4: Vision */}
          <section className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 font-[Merriweather]">
              The vision
            </h2>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
              The future of content is not manual. 
              VinciFlow aims to make brand content fully automated, consistent, and scalable.
            </p>
          </section>

          {/* Section 5: CTA */}
          <section className="pt-16 border-t border-slate-200 text-center">
            <h3 className="text-3xl font-extrabold text-slate-800 mb-8 font-[Handlee]">
              Try VinciFlow today
            </h3>
            <button 
              onClick={() => navigate('/signup')}
              className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl active:scale-95 hover:shadow-2xl"
            >
              Get Started
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </button>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;