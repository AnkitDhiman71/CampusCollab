import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center gap-2 p-2 rounded-2xl transition-all duration-300 cursor-pointer select-none ${
        isDark
          ? 'bg-slate-800/80 text-amber-300 hover:bg-slate-700/80 border border-slate-700/80 shadow-md shadow-black/20'
          : 'bg-white/80 text-slate-700 hover:text-blue-600 hover:bg-white border border-slate-200/80 shadow-md shadow-slate-900/5'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]" />
        ) : (
          <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-bold tracking-tight pr-1">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
