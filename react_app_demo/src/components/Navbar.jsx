import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLoggedIn = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.fullName || user.username || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const links = isLoggedIn ? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/search',    label: 'Search'    },
    { to: '/upload',    label: 'Upload'    },
  ] : [
    { to: '/',        label: 'Home'    },
    { to: '/about',   label: 'About'   },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-bgCard/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`} role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-6 max-2xl:px-8 flex items-center justify-between">
        {/* Brand */}
        <button
          className="flex items-center gap-2"
          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
          aria-label="Go to home page"
        >
          <span className="w-3 h-3 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span className="font-display font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-accent2">PDFBrat</span>
        </button>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-accent font-semibold' : 'text-textSecondary hover:text-accent'}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Auth & Theme buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button className="text-textSecondary hover:text-accent transition-colors text-sm font-medium" onClick={toggleTheme} aria-label="Toggle Dark Mode">
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Avatar name={userName} size="sm" />
              <span className="text-sm font-medium text-textPrimary">{user.fullName || user.username || 'User'}</span>
              <button className="px-4 py-2 rounded-lg border border-border text-textPrimary hover:border-accent hover:bg-accentGlow transition-all text-sm font-semibold" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="px-4 py-2 rounded-lg border border-border text-textPrimary hover:border-accent hover:bg-accentGlow transition-all text-sm font-semibold">Login</NavLink>
              <NavLink to="/register" className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent to-purple-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accentGlow transition-all text-sm font-semibold">Get Started</NavLink>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle mobile menu"
          aria-expanded={menuOpen}
        >
          <span className={`block w-6 h-0.5 bg-textPrimary transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-textPrimary transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-textPrimary transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-bgCard backdrop-blur-md border-b border-border p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 md:hidden" role="menu">
          {isLoggedIn && (
            <div className="flex items-center gap-4 border-b border-border pb-4 mb-2">
              <Avatar name={userName} size="md" glow />
              <span className="font-semibold text-textPrimary">{user.fullName || user.username || 'User'}</span>
            </div>
          )}
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className="text-lg font-medium text-textSecondary hover:text-accent"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
            {isLoggedIn ? (
              <button className="w-full py-3 rounded-lg border border-border text-textPrimary font-semibold hover:border-accent hover:bg-accentGlow" onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</button>
            ) : (
              <>
                <NavLink to="/login" className="w-full py-3 text-center rounded-lg border border-border text-textPrimary font-semibold hover:border-accent hover:bg-accentGlow" onClick={() => setMenuOpen(false)}>Login</NavLink>
                <NavLink to="/register" className="w-full py-3 text-center rounded-lg bg-gradient-to-r from-accent to-purple-500 text-white font-semibold shadow-md" onClick={() => setMenuOpen(false)}>Register</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
