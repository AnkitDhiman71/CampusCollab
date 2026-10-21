import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../Components/AdminNavbar';
import { MessageSquare, Mail, User, Trash2, Loader2, Search } from 'lucide-react';
import { getAllInquiriesAdmin, deleteInquiryAdmin } from '../../API/admin';

export function AdminQueries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await getAllInquiriesAdmin();
      if (res?.success) {
        setInquiries(res.inquiries || []);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      const res = await deleteInquiryAdmin(id);
      if (res?.success) {
        setInquiries((prev) => prev.filter((i) => i._id !== id));
        setMsg('Inquiry deleted.');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {
      alert('Failed to delete inquiry.');
    }
  };

  const filtered = inquiries.filter((i) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.subject.toLowerCase().includes(q) ||
      i.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Contact Queries & Support</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Read and manage support inquiries, feature requests, and messages sent to administration
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold text-amber-500 dark:text-amber-400">
            Total Queries: {inquiries.length}
          </span>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            {msg}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Loading inquiries...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold">No contact inquiries submitted yet.</p>
              <p className="text-xs text-slate-500 mt-1">Inquiries sent via the Contact page will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => (
                <div
                  key={item._id}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{item.subject}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      "{item.message}"
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-slate-200">{item.name}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`mailto:${item.email}`} className="text-amber-400 hover:underline">{item.email}</a>
                      </span>
                    </div>
                  </div>

                  <div className="self-end sm:self-start">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                      title="Delete Inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminQueries;
