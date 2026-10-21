import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Mail, 
  Lock, 
  ArrowRight, 
  User, 
  Search, 
  Send, 
  Eye, 
  EyeOff, 
  Zap, 
  Trophy,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { loginUser } from '../../API/auth';
import ThemeToggle from '../../Components/ThemeToggle';

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = {};
    if (!formData.email?.trim()) errs.email = 'Please enter your institute email address.';
    if (!formData.password) errs.password = 'Please enter your password.';
    
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(formData);
      if (data?.success) {
        sessionStorage.setItem('cc_auth', 'true');
        if (data.user) {
          localStorage.setItem('cc_user', JSON.stringify(data.user));
        }
        if (data.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      } else {
        setServerError(data.message || 'Invalid credentials. Please check your email and password.');
      }
    } catch {
      setServerError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden glass-canvas transition-colors duration-300">
      {/* Subtle Atmospheric Light Refraction Orbs */}
      <div className="absolute -top-16 -left-16 w-[36rem] h-[36rem] rounded-full blur-[140px] pointer-events-none transition-all duration-500" 
        style={{ background: 'var(--orb-1)' }} 
      />
      <div className="absolute top-1/4 -right-16 w-[42rem] h-[42rem] rounded-full blur-[160px] pointer-events-none transition-all duration-500" 
        style={{ background: 'var(--orb-2)' }} 
      />
      <div className="absolute -bottom-24 left-1/3 w-[32rem] h-[32rem] rounded-full blur-[140px] pointer-events-none transition-all duration-500" 
        style={{ background: 'var(--orb-3)' }} 
      />

      {/* Top Header Navigation matching Screenshot */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-5 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/25 shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-slate-900 dark:text-white transition-colors">
              CampusCollab
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 transition-colors">
              Institute Skill & Collaboration Network
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle Button */}
          <ThemeToggle showLabel={false} />

          <Link
            to="/register"
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl glass-btn-cta text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer shrink-0"
          >
            <span>Register as Candidate</span>
            <span className="text-sm font-extrabold">→</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area: Left Showcase + Right Sign In Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 py-8 lg:py-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Hero Presentation & Steps */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Institute Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-bold shadow-sm">
              <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400 animate-pulse" />
              <span>Institute Collaboration Platform</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-black leading-[1.12] tracking-tight text-slate-900 dark:text-white transition-colors">
              Find the right person in <br className="hidden sm:inline" />
              your institute <br />
              <span className="brand-gradient-text drop-shadow-sm">
                based on what you need.
              </span>
            </h2>

            {/* Subtitle Description */}
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-medium transition-colors">
              Register your skills or search verified peers across departments for hackathons, major/minor projects, and 1-on-1 student help.
            </p>

            {/* How It Works Glass Card */}
            <div className="glass-panel-sub rounded-[28px] p-5 sm:p-6 space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-600 dark:text-slate-400">
                HOW IT WORKS:{' '}
                <span className="text-blue-600 dark:text-sky-400 font-black">
                  SKILL → PERSON → REQUEST → TEAM
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                
                {/* Step 1: Create Profile */}
                <div className="glass-tile flex items-center justify-between p-3.5 rounded-2xl group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white">
                        Create Profile & Skills
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Add stack (MERN, React, Python, C++)
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors font-bold text-sm pl-2">
                    →
                  </span>
                </div>

                {/* Step 2: Search Peers */}
                <div className="glass-tile flex items-center justify-between p-3.5 rounded-2xl group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white">
                        Search Peers
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Find candidate by skill or department
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-bold text-sm pl-2">
                    →
                  </span>
                </div>

                {/* Step 3: Send Request */}
                <div className="glass-tile flex items-center justify-between p-3.5 rounded-2xl group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      <Send className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white">
                        Send Request
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Approach candidate with project details
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-bold text-sm pl-2">
                    →
                  </span>
                </div>

                {/* Step 4: Build Team */}
                <div className="glass-tile flex items-center justify-between p-3.5 rounded-2xl group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white">
                        Build Team
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Accept / Reject & collaborate
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-bold text-sm pl-2">
                    →
                  </span>
                </div>

              </div>
            </div>

            {/* Bottom Quick Metric Pills (as shown in image footer) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl glass-tile text-xs font-semibold">
                <Users className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <span className="text-slate-500 dark:text-slate-400">Pending Requests</span>
                <strong className="text-slate-900 dark:text-white font-black text-sm">0</strong>
              </div>

              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl glass-tile text-xs font-semibold">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400">Active Collaborations</span>
                <strong className="text-slate-900 dark:text-white font-black text-sm">0</strong>
              </div>

              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl glass-tile text-xs font-semibold">
                <Trophy className="w-4 h-4 text-purple-500" />
                <span className="text-slate-500 dark:text-slate-400">Joined Teams</span>
                <strong className="text-slate-900 dark:text-white font-black text-sm">0</strong>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: VisionOS Floating Sign In Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="glass-panel rounded-[32px] p-7 sm:p-9 shadow-2xl relative border border-white/80 dark:border-white/10">
              
              {/* Top User Avatar Circle Icon */}
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
                <User className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Sign In
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                  Access candidate portal or admin console
                </p>
              </div>

              {serverError && (
                <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs font-semibold text-center backdrop-blur-md">
                  ⚠️ {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                    Institute Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="student@maimt.com"
                      className="w-full pl-10 pr-4 py-3 glass-input-field rounded-2xl text-xs sm:text-sm font-medium transition-all"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">⚠️ {fieldErrors.email}</p>
                  )}
                </div>

                {/* Password Field with Eye Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 glass-input-field rounded-2xl text-xs sm:text-sm font-medium transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">⚠️ {fieldErrors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 glass-btn-cta rounded-2xl text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer mt-5 shadow-lg shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              {/* Card Footer Register Link */}
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 text-center">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                  New student candidate?{' '}
                  <Link 
                    to="/register" 
                    className="font-bold text-blue-600 dark:text-sky-400 hover:underline transition-colors"
                  >
                    Register Profile & Skills →
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200/50 dark:border-white/10 backdrop-blur-md">
        CampusCollab &bull; Institute Skill & Collaboration Network
      </footer>
    </div>
  );
}

export default Login;
