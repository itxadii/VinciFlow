import React from 'react';
import HeroSection from '../components/landingpage/HeroSection';

const LandingPage = () => {
  return (
    <main>
      {/* You can add more sections here later, like Features, Pricing, or FAQ */}
      <HeroSection />
      
      {/* Example of adding another section later */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Scalable AI Automation</h2>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;