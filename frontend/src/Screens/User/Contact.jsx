import React, { useState } from 'react';
import { useFormik } from 'formik';
import Layout from '../../Components/Layout';
import { Mail, Send, User, MessageSquare, Tag, CheckCircle2, Phone, MapPin } from 'lucide-react';

const validate = (values) => {
  const errors = {};
  if (!values.name) errors.name = 'Full name is required';
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }
  if (!values.subject) errors.subject = 'Subject is required';
  if (!values.message) {
    errors.message = 'Message is required';
  } else if (values.message.length < 10) {
    errors.message = 'Message must be at least 10 characters';
  }
  return errors;
};

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    validate,
    onSubmit: async (values, { resetForm }) => {
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (data?.success) {
          setSubmitted(true);
          resetForm();
          setTimeout(() => setSubmitted(false), 5000);
        }
      } catch {
        alert('Failed to send inquiry. Please try again.');
      }
    },
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Glass Header Panel for crystal clear contrast against mountain peaks */}
        <div className="glass-panel p-6 sm:p-8 rounded-[32px] text-center space-y-2 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider mb-1">
            <Mail className="w-3.5 h-3.5 text-amber-300" />
            <span>Support & Inquiries</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            Contact Support & Admin
          </h1>
          <p className="text-white/80 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
            Have questions or need assistance regarding institute collaborations? Send us a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="space-y-4 lg:col-span-1">
            <div className="p-5 rounded-[26px] glass-panel-sub text-white space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-amber-300 shadow-md">
                  <Mail className="w-5 h-5 drop-shadow-[0_1px_4px_rgba(251,191,36,0.5)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Email Us</h3>
                  <p className="text-xs text-white/70">support@campuscollab.edu</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-[26px] glass-panel-sub text-white space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-emerald-300 shadow-md">
                  <Phone className="w-5 h-5 drop-shadow-[0_1px_4px_rgba(52,211,153,0.5)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Campus Helpline</h3>
                  <p className="text-xs text-white/70">+91 (0) 1800-CAMPUS-CARE</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-[26px] glass-panel-sub text-white space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-purple-300 shadow-md">
                  <MapPin className="w-5 h-5 drop-shadow-[0_1px_4px_rgba(216,180,254,0.5)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Location</h3>
                  <p className="text-xs text-white/70">Student Cell, Academic Block</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 sm:p-8 rounded-[32px] glass-panel shadow-2xl relative overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Send a Message</h2>
            <p className="text-white/70 text-xs mb-6 font-medium">Inquiries are sent directly to the administrative panel</p>

            {submitted && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-center gap-3 text-sm font-semibold backdrop-blur-md shadow-md animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <span>Thank you! Your inquiry has been submitted to the administration.</span>
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    name="name"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.name}
                    placeholder="Rahul Sharma"
                    className="w-full pl-10 pr-4 py-3 glass-input-field rounded-2xl text-sm text-white placeholder-white/40 font-medium"
                  />
                </div>
                {formik.touched.name && formik.errors.name && (
                  <p className="text-amber-300 text-xs mt-1 font-semibold">⚠️ {formik.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Institute Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
                  <input
                    type="email"
                    name="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                    placeholder="student@maimt.com"
                    className="w-full pl-10 pr-4 py-3 glass-input-field rounded-2xl text-sm text-white placeholder-white/40 font-medium"
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="text-amber-300 text-xs mt-1 font-semibold">⚠️ {formik.errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Subject
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    name="subject"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.subject}
                    placeholder="e.g. Request to feature new hackathon project"
                    className="w-full pl-10 pr-4 py-3 glass-input-field rounded-2xl text-sm text-white placeholder-white/40 font-medium"
                  />
                </div>
                {formik.touched.subject && formik.errors.subject && (
                  <p className="text-amber-300 text-xs mt-1 font-semibold">⚠️ {formik.errors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Message
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
                  <textarea
                    rows={4}
                    name="message"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.message}
                    placeholder="Describe your inquiry or request..."
                    className="w-full pl-10 pr-4 py-3 glass-input-field rounded-2xl text-sm text-white placeholder-white/40 font-medium resize-none"
                  />
                </div>
                {formik.touched.message && formik.errors.message && (
                  <p className="text-amber-300 text-xs mt-1 font-semibold">⚠️ {formik.errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="glass-btn-cta w-full py-3.5 px-6 rounded-2xl text-slate-950 font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Contact;
