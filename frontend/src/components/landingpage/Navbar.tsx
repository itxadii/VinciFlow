import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import routing tools

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // Hook for programmatic navigation

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' }, // Updated to absolute paths
    { name: 'Integrations', path: '#integrations' },
    { name: 'Docs', path: '#docs' },
    { name: 'Pricing', path: '#pricing' },
  ];

  return (
    <nav className="fixed w-full z-50 top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo Section - Links back to Home */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/vinciflow-logo.JPG" alt="VinciFlow Logo" className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              VinciFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path} // Use 'to' instead of 'href'
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-900 font-medium">Log in</button>
              {/* Navigate to dashboard on click */}
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Menu Button (unchanged logic) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)} // Close menu on click
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 pb-3 border-t border-gray-100">
              <button onClick={() => { navigate('/login'); setIsOpen(false); }}className="w-full text-left px-3 py-2 text-base font-medium text-gray-700">Log in</button>
              <button 
                onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                className="mt-2 w-full bg-blue-600 text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;