import HeroSection from "@/components/landingpage/HeroSection";

const LandingPage = () => {
  return (
    <div className="w-full" style={{ position: 'relative', zIndex: 2 }}>
      <HeroSection />

      {/* We can add a "Live Preview" section here next */}
      <section className="py-24" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">One Click. Everywhere.</h2>
          <p className="text-gray-500 text-lg">Your brand, synchronized across the social web.</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;