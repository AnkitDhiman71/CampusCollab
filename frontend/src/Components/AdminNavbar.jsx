import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  Send, 
  UsersRound, 
  MessageSquare, 
  ShieldAlert, 
  Code2, 
  PlusCircle, 
  LogOut, 
  ArrowLeft, 
  Menu, 
  X 
} from 'lucide-react';
import { logoutUser } from '../API/auth';
import ThemeToggle from './ThemeToggle';

export function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setIsOpen(false);
      navigate('/');
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Candidates', path: '/admin/candidates', icon: Users },
    { name: 'Questions', path: '/admin/questions', icon: Code2 },
    { name: 'Security', path: '/admin/logs', icon: ShieldAlert },
    { name: 'Requests', path: '/admin/requests', icon: Send },
    { name: 'Teams', path: '/admin/teams', icon: UsersRound },
    { name: 'Queries', path: '/admin/queries', icon: MessageSquare },
  ];

  return (
    <nav ref={menuRef} className="glass-navbar sticky top-0 z-50 shadow-md w-full transition-all duration-300">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* 1. Left: Admin Brand Logo */}
          <Link to="/admin" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                CampusCollab
              </span>
              <span className="ml-1.5 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/30">
                ADMIN
              </span>
            </div>
          </Link>

          {/* 2. Middle: Desktop Segmented Pill Dock (Optimized to fit on all laptop & desktop screens) */}
          <div className="hidden xl:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10 shrink min-w-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 active:scale-95'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* 3. Middle-Compact: Medium/Large Screens (1024px to 1279px) */}
          <div className="hidden lg:flex xl:hidden items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  title={link.name}
                  className={`p-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* 4. Right Controls: Desktop */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link
              to="/admin/questions"
              className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-sky-400 text-xs font-bold border border-blue-500/30 flex items-center gap-1.5 transition-all"
              title="Add a new technical assessment question to DB"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">New Question</span>
            </Link>

            <ThemeToggle />

            <Link
              to="/home"
              className="px-2.5 2xl:px-3 py-1.5 rounded-xl glass-btn-ghost text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 hover:text-blue-600 dark:hover:text-white transition-all"
              title="Switch to Student View"
            >
              <ArrowLeft className="w-3 h-3 shrink-0" />
              <span className="hidden xl:inline">Student</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-2.5 2xl:px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 text-xs font-bold border border-red-500/20 flex items-center gap-1 cursor-pointer transition-all shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

          {/* 5. Mobile & Tablet (< 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
            <ThemeToggle />

            <Link
              to="/home"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700 hover:text-blue-600 dark:hover:text-white transition-all"
              title="Switch to Student View"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Student</span>
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
              aria-label="Toggle admin navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-5 h-5 text-blue-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Quick link to Add Question directly */}
          <Link
            to="/admin/questions"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add New Question to DB</span>
          </Link>

          {/* Navigation Links List */}
          <div className="space-y-1 pt-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Footer inside mobile menu */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
            <Link
              to="/home"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Switch to Student View</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 text-xs font-bold border border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default AdminNavbar;
