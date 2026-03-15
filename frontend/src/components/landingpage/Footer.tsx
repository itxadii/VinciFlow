import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      className="w-full px-6 py-12"
      style={{
        background: 'rgba(255, 255, 255, 0.60)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Top row */}
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">

          {/* Brand */}
          <div className="flex flex-col gap-3 max-w-xs">
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: "'Handlee', cursive", color: '#0f172a' }}
            >
              VinciFlow
            </span>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI-powered brand content automation. Describe your brand once — we handle the rest.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-2">
              {[
                { icon: <Instagram size={17} />, href: 'https://instagram.com', color: '#ec4899' },
                { icon: <Twitter size={17} />, href: 'https://twitter.com', color: '#3b82f6' },
                { icon: <Facebook size={17} />, href: 'https://facebook.com', color: '#6366f1' },
                { icon: <Github size={17} />, href: 'https://github.com', color: '#0f172a' },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
                  style={{ background: `${s.color}12`, color: s.color }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${s.color}25`}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${s.color}12`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-10">
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 mb-4">PRODUCT</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Integrations', path: '/integrations' },
                  { label: 'Pricing', path: '/pricing' },
                  { label: 'Docs', path: '/docs' },
                ].map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.path}
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 mb-4">PLATFORM</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Brand Aura', path: '/docs' },
                  { label: 'AI Posters', path: '/docs' },
                  { label: 'Auto Schedule', path: '/docs' },
                  { label: 'Publishing', path: '/docs' },
                ].map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.path}
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 mb-4">COMPANY</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'About', path: '/' },
                  { label: 'GitHub', path: 'https://github.com' },
                  { label: 'LinkedIn', path: 'https://linkedin.com' },
                ].map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.path}
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px mb-6" style={{ background: 'rgba(0,0,0,0.07)' }} />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} VinciFlow. Built by{' '}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-slate-700 transition-colors"
              style={{ color: '#8b5cf6' }}
            >
              Aditya Waghmare
            </a>
          </p>
          <p className="text-xs text-slate-400">
            Powered by AWS · Bedrock · Step Functions · Meta Graph API
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;