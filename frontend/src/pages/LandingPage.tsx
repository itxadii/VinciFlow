import HeroSection from "@/components/landingpage/HeroSection";
import Footer from '../components/landingpage/Footer';
import ResultCard from "@/components/GeneratedResults"; // Make sure this path is correct!

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#fafafa]">
      
      <HeroSection />

      {/* Live Preview Section */}
      <section className="py-24 bg-white/55 backdrop-blur-md flex flex-col items-center">
        
        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-4 text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Montserrat'] text-slate-800 tracking-tight">
            One Click. Everywhere.
          </h2>
          <p className="text-gray-500 text-lg md:text-xl font-['Montserrat']">
            Your brand, synchronized across the social web.
          </p>
        </div>
        
        {/* 3-Column Grid for Cards */}
        <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
          
          {/* CARD 1: The Draft (Showcases your Festival feature & Approval UI) */}
          <div className="w-full max-w-sm transform transition-all duration-300 hover:-translate-y-2">
            <ResultCard 
              image="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"
              content="Glow bright this Diwali! ✨ Our new Vitamin C serum is the perfect addition to your festive prep. **Get that radiant look naturally** without the harsh chemicals. 🪔💛"
              hashtags={[]} 
              scheduledDate={new Date(Date.now() + 86400000).toISOString()} // Tomorrow
              status="DRAFT" 
              onAccept={(platforms) => console.log('Accepted for:', platforms)}
              onReject={() => console.log('Rejected')}
            />
          </div>

          {/* CARD 2: Scheduled (Showcases the UI after a user hits approve) */}
          <div className="w-full max-w-sm transform transition-all duration-300 hover:-translate-y-2">
            <ResultCard 
              image="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=600&auto=format&fit=crop"
              content="Morning fuel sorted. ☕️ We just dropped our new single-origin Ethiopian roast. **Rich, bold, and ready to brew.** Hit the link in bio to grab your bag. 🌅"
              hashtags={[]} 
              scheduledDate={new Date(Date.now() + 432000000).toISOString()} // 5 days from now
              status="SCHEDULED" 
              onAccept={(platforms) => console.log('Accepted for:', platforms)}
              onReject={() => console.log('Rejected')}
            />
          </div>

          {/* CARD 3: Published (Showcases historical success) */}
          <div className="w-full max-w-sm transform transition-all duration-300 hover:-translate-y-2">
            <ResultCard 
              image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop"
              content="Push your limits. 🏋️‍♂️ Our new breathable activewear line is engineered to keep you cool during your toughest sets. **No excuses. Just execution.** 💯🔥"
              hashtags={[]} 
              scheduledDate={new Date(Date.now() - 172800000).toISOString()} // 2 days ago
              status="PUBLISHED" 
              onAccept={(platforms) => console.log('Accepted for:', platforms)}
              onReject={() => console.log('Rejected')}
            />
          </div>

        </div>

      </section>

      <Footer />

    </div>
  );
};

export default LandingPage;