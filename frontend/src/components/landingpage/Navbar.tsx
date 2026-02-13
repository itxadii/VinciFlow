import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // Icons for better mobile UI

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Integrations', path: '/integrations' },
    { name: 'Docs', path: '/docs' },
    { name: 'Pricing', path: '/pricing' },
  ];

  return (
    
    <div className="fixed w-full top-6 z-50 px-4 flex justify-center bg-yellow">
      {/* Main Island Container */}
      <nav className={`w-full max-w-5xl bg-white/70 backdrop-blur-xl border border-gray-500 shadow-xl transition-all duration-300 bg-yellow-50 ${isOpen ? 'rounded-3xl' : 'rounded-full'}`}>
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-2">
              <img src="/vinciflow-logo.JPG" alt="VinciFlow" className="h-8 w-8 rounded-full" />
  
            <span className="text-3xl font-bold text-slate-900 font-['Caveat']">
              VinciFlow
            </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-6 w-[1px] bg-gray-300 mx-2" />
              <span className="font-['Handlee']">
              <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-700 hover:text-slate-900">
                Log in
              </button>
              </span>
              <span className="text-3xl font-bold text-slate-900 font-['Handlee']">
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                Get Started
              </button>
              </span>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown - Now visible because it's inside the pill height expansion */}
          {isOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-2 animate-in fade-in zoom-in duration-200">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-semibold text-slate-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
                <button 
                  onClick={() => { navigate('/login'); setIsOpen(false); }}
                  className="w-full py-3 text-base font-bold text-slate-700 text-center"
                >
                  Log in
                </button>
                <button 
                  onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-center shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;