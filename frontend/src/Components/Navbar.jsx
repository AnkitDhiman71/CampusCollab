import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Search, Send, UserCheck, User, Mail, LogIn, LogOut, ShieldCheck, Menu, X, MessageSquare } from 'lucide-react';
import { getMe, logoutUser } from '../API/auth';
import ThemeToggle from './ThemeToggle';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cc_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    getMe()
      .then((data) => {
        if (isMounted && data?.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('cc_user', JSON.stringify(data.user));
          sessionStorage.setItem('cc_auth', 'true');
        } else if (isMounted && !data?.success) {
          setCurrentUser(null);
          localStorage.removeItem('cc_user');
          sessionStorage.removeItem('cc_auth');
        }
      })
      .catch(() => {
        // keep current cached state if offline/network error
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      localStorage.removeItem('cc_user');
      sessionStorage.removeItem('cc_auth');
      setCurrentUser(null);
      setIsOpen(false);
      navigate('/');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/home', icon: Users },
    { name: 'Peers', path: '/search', icon: Search },
    { name: 'Requests', path: '/requests', icon: Send },
    { name: 'Teams', path: '/teams', icon: UserCheck },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-navbar transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* 1. Left: Brand Logo */}
          <Link to="/home" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight transition-colors">
                CampusCollab
              </span>
            </div>
          </Link>

          {/* 2. Middle: Segmented Pill Dock for Nav Links */}
          <div className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 active:scale-95'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* 3. Right: User Controls & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <ThemeToggle />

            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-2.5 py-1.5 rounded-xl glass-btn-ghost text-blue-600 dark:text-sky-400 font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-2xl glass-tile text-xs border border-white/40 dark:border-white/10">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                    {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[90px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {currentUser.department || 'Student'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 font-bold text-xs border border-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                  title="Sign Out of CampusCollab"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="px-4 py-2 rounded-2xl glass-btn-cta text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/25"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* 4. Mobile Menu & Theme Toggle Trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />

            {currentUser && currentUser.role === 'admin' && (
              <Link
                to="/admin"
                className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-sky-400 font-bold text-xs border border-blue-500/20 flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl glass-tile text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-5 h-5 text-blue-600 dark:text-sky-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Mobile Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-white/10 glass-panel-sub rounded-none px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {currentUser && (
            <div className="p-3 mb-2 rounded-2xl glass-tile flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20">
                {currentUser.department || 'Student'}
              </span>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 font-bold text-xs border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 rounded-2xl glass-btn-cta text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;