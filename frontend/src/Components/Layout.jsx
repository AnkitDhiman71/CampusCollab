import React from 'react';
import Navbar from './Navbar';

export function Layout({ children }) {
  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas transition-colors duration-300">
      {/* Ambient background glow orbs for rich glass refraction */}
      <div 
        className="fixed -top-12 -left-12 w-[34rem] h-[34rem] rounded-full blur-[140px] pointer-events-none z-0 transition-all duration-500" 
        style={{ background: 'var(--orb-1)' }}
      />
      <div 
        className="fixed top-1/3 -right-12 w-[44rem] h-[44rem] rounded-full blur-[160px] pointer-events-none z-0 transition-all duration-500" 
        style={{ background: 'var(--orb-2)' }}
      />
      <div 
        className="fixed -bottom-20 left-1/4 w-[32rem] h-[32rem] rounded-full blur-[140px] pointer-events-none z-0 transition-all duration-500" 
        style={{ background: 'var(--orb-3)' }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="text-center py-4 text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200/60 dark:border-white/10 backdrop-blur-md bg-white/40 dark:bg-black/20">
          CampusCollab &bull; Institute Skill & Collaboration Network
        </footer>
      </div>
    </div>
  );
}

export default Layout;