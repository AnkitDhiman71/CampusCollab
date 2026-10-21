import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { 
  UserPlus, User, Mail, Lock, BookOpen, Sparkles, ArrowRight, 
  Users, CheckCircle2, KeyRound, Loader2, ShieldCheck 
} from 'lucide-react';
import { signupUser, sendOtp, verifyOtp } from '../../API/auth';

export function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      otp: '',
      department: 'BBA',
      skills: '',
      password: '',
      githubUrl: '',
      bio: '',
    },
    validate: (values) => {
      const errors = {};
      if (!values.name?.trim()) {
        errors.name = 'Full name is required';
      }
      if (!values.email?.trim()) {
        errors.email = 'Email address is required';
      } else if (!isAdmin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Please enter a valid email address';
      }
      if (!isAdmin && !otpVerified && !values.otp?.trim()) {
        errors.otp = 'Please verify your email with OTP';
      }
      if (!values.skills?.trim()) {
        errors.skills = 'Skills are required';
      }
      if (!values.password) {
        errors.password = 'Password is required';
      } else if (values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');
      setEmailError('');
      if (!isAdmin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        setEmailError('Please enter a valid email address');
        setSubmitting(false);
        return;
      }
      if (!isAdmin && !otpVerified) {
        setOtpErr('Please verify your student email with OTP first.');
        setSubmitting(false);
        return;
      }
      try {
        const data = await signupUser(values);
        if (data?.success) {
          navigate(data.user?.role === 'admin' ? '/admin' : '/home');
        } else {
          setServerError(data.message || 'Registration failed.');
        }
      } catch {
        setServerError('Unable to connect to server.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleEmailChange = (e) => {
    formik.handleChange(e);
    setEmailError('');
    const email = e.target.value.toLowerCase().trim();
    const adminCheck = email.includes('admin') || email === 'admin@campuscollab.edu';
    setIsAdmin(adminCheck);
    setOtpVerified(adminCheck);
    setOtpSent(false);
    setOtpMsg(adminCheck ? 'Admin email detected — OTP verification bypassed.' : '');
    setOtpErr('');
  };

  const handleSendOtp = async () => {
    setEmailError('');
    setOtpErr('');
    setOtpMsg('');

    const email = formik.values.email.toLowerCase().trim();
    if (!email) {
      setEmailError('Please enter your email address first.');
      formik.setFieldTouched('email', true);
      return;
    }

    if (!isAdmin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      formik.setFieldTouched('email', true);
      return;
    }

    if (isAdmin) return;

    setOtpSending(true);
    try {
      const res = await sendOtp(email);
      if (res?.success) {
        if (res.isAdmin) {
          setIsAdmin(true);
          setOtpVerified(true);
          setOtpMsg(res.message);
        } else {
          setOtpSent(true);
          setTimer(30);
          setOtpMsg(res.message || 'OTP has been sent to your email. Please check your inbox.');
          if (res.otp) {
            formik.setFieldValue('otp', res.otp);
          }
        }
      } else {
        setEmailError(res.message || 'Failed to send OTP.');
      }
    } catch {
      setEmailError('Server connection failed. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formik.values.otp?.trim()) {
      setOtpErr('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpErr('');
    try {
      const res = await verifyOtp(formik.values.email, formik.values.otp);
      if (res?.success) {
        setOtpVerified(true);
        setOtpMsg('✓ Email verified successfully!');
      } else {
        setOtpErr(res.message || 'Invalid or expired OTP code.');
      }
    } catch {
      setOtpErr('Verification failed. Please check connection.');
    }
  };

  const emailErrorMessage = emailError || ((formik.touched.email || formik.submitCount > 0) ? formik.errors.email : '');

  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas text-slate-100 overflow-x-hidden">
      {/* Ambient glass lighting orbs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-orange-500/15 rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 text-amber-300 flex items-center justify-center font-black shadow-lg">
            <Users className="w-5 h-5 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white drop-shadow-sm">CampusCollab</h1>
            <p className="text-[11px] text-amber-200/90 font-medium tracking-wide">Institute Network</p>
          </div>
        </div>
        <Link to="/" className="glass-btn-ghost px-4 py-2 rounded-xl text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 transition-all">
          ← Back to Sign In
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg glass-panel p-6 sm:p-9 shadow-2xl relative">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-md">
              <UserPlus className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">Student Registration</h2>
            <p className="text-xs text-white/70 font-medium mt-1">Fast profile registration with OTP (@maimt.com)</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/20 border border-red-300/40 text-red-200 text-xs font-bold text-center backdrop-blur-md">
              ⚠️ {serverError}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/90 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  name="name"
                  placeholder="Rahul Sharma"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full pl-10 pr-3 py-3 glass-input-field rounded-2xl text-sm text-white placeholder-white/40 font-medium"
                />
              </div>
              {(formik.touched.name || formik.submitCount > 0) && formik.errors.name && (
                <p className="text-amber-300 text-xs mt-1 font-semibold">⚠️ {formik.errors.name}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-white/90">Institute Email (@maimt.com) *</label>
                {isAdmin ? (
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 drop-shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin (OTP exempt)
                  </span>
                ) : otpVerified ? (
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 drop-shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : null}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
                  <input
                    type="email"
                    name="email"
                    placeholder="student@maimt.com"
                    value={formik.values.email}
                    onChange={handleEmailChange}
                    onBlur={formik.handleBlur}
                    disabled={otpVerified && !isAdmin}
                    className={`w-full pl-10 pr-3 py-3 glass-input-field rounded-2xl text-sm text-white placeholder-white/40 font-medium ${
                      otpVerified ? 'border-emerald-400/50 bg-emerald-500/10' : ''
                    }`}
                  />
                </div>
                {!isAdmin && !otpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || timer > 0 || !formik.values.email}
                    className="glass-btn-cta px-4 py-3 rounded-2xl text-slate-950 font-black text-xs shadow-md whitespace-nowrap cursor-pointer transition-all disabled:opacity-50"
                  >
                    {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : timer > 0 ? `${timer}s` : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                )}
              </div>
              {emailErrorMessage && (
                <p className="text-amber-300 text-xs mt-1 font-semibold">⚠️ {emailErrorMessage}</p>
              )}
            </div>

            {!isAdmin && (otpSent || otpVerified) && (
              <div className="p-3.5 glass-tile rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-white/90">Enter Email Verification OTP *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      maxLength={6}
                      name="otp"
                      placeholder="6-digit code"
                      value={formik.values.otp}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={otpVerified}
                      className="w-full pl-9 pr-3 py-2.5 glass-input-field rounded-xl text-sm font-mono tracking-widest text-center text-white focus:outline-none"
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={!formik.values.otp || formik.values.otp.length !== 6}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-300/40 text-white font-bold text-xs cursor-pointer shadow-md transition-all disabled:opacity-50"
                    >
                      Verify
                    </button>
                  )}
                </div>
                {otpErr && <p className="text-amber-300 text-xs font-semibold">⚠️ {otpErr}</p>}
                {otpMsg && <p className="text-emerald-300 text-xs font-semibold">✓ {otpMsg}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white/90 mb-1.5">Department</label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50 pointer-events-none" />
                <select
                  name="department"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  className="w-full pl-10 pr-3 py-3 glass-input-field rounded-2xl text-sm font-medium text-white appearance-none cursor-pointer"
                >
                  <option value="BBA" className="bg-slate-900 text-white">BBA</option>
                  <option value="BCA" className="bg-slate-900 text-white">BCA</option>
                  <option value="MBA" className="bg-slate-900 text-white">MBA</option>
                  <option value="MCA" className="bg-slate-900 text-white">MCA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/90 mb-1.5">Skills *</label>
              <div className="relative">
                <Sparkles className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  name="skills"
                  placeholder="e.g. React, Node.js, Python, MongoDB"
                  value={formik.values.skills}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full pl-10 pr-3 py-3 glass-input-field rounded-2xl text-sm font-medium text-white placeholder-white/40"
                />
              </div>
              {(formik.touched.skills || formik.submitCount > 0) && formik.errors.skills && (
                <p className="text-amber-300 text-xs mt-1 font-semibold">⚠️ {formik.errors.skills}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-white/90 mb-1.5">
                GitHub Profile <span className="text-white/50 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-white/50">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="githubUrl"
                  placeholder="e.g. github.com/your-username"
                  value={formik.values.githubUrl}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full pl-10 pr-3 py-3 glass-input-field rounded-2xl text-sm font-medium text-white placeholder-white/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/90 mb-1.5">
                Short Bio / Interests <span className="text-white/50 font-normal">(Optional)</span>
              </label>
              <textarea
                name="bio"
                rows={2}
                placeholder="What projects are you looking to collaborate on?"
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full p-3 glass-input-field rounded-2xl text-sm font-medium text-white placeholder-white/40 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/90 mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full pl-10 pr-3 py-3 glass-input-field rounded-2xl text-sm font-medium text-white placeholder-white/40"
                />
              </div>
              {(formik.touched.password || formik.submitCount > 0) && formik.errors.password && (
                <p className="text-amber-300 text-xs mt-1 font-semibold">⚠️ {formik.errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="glass-btn-cta w-full py-3.5 rounded-2xl text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 mt-4 cursor-pointer transition-all disabled:opacity-50"
            >
              {formik.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Register Candidate <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-white/70 font-medium">
              Already registered?{' '}
              <Link to="/" className="font-bold text-amber-300 hover:text-amber-200 underline">
                Sign In →
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-white/60 backdrop-blur-xl bg-black/25 border-t border-white/10">
        CampusCollab &bull; Student Profile Registration
      </footer>
    </div>
  );
}

export default Register;