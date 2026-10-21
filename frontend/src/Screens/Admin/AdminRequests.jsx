import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../Components/AdminNavbar';
import { Send, Search, Filter, Loader2, Trash2 } from 'lucide-react';
import { getAllRequestsAdmin, deleteRequestAdmin } from '../../API/admin';

export function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [msg, setMsg] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getAllRequestsAdmin();
      if (res?.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this collaboration request?')) return;
    try {
      const res = await deleteRequestAdmin(id);
      if (res?.success) {
        setRequests((prev) => prev.filter((r) => r._id !== id));
        setMsg('Request deleted successfully.');
        setTimeout(() => setMsg(''), 4000);
      } else {
        alert(res?.message || 'Failed to delete request.');
      }
    } catch (err) {
      console.error('Delete request error:', err);
      alert('Failed to delete request.');
    }
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (r.sender?.name && r.sender.name.toLowerCase().includes(q)) ||
      (r.recipient?.name && r.recipient.name.toLowerCase().includes(q)) ||
      (r.message && r.message.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">All Collaboration Requests</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Oversee all student peer-to-peer help and team requests across departments
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold text-amber-500 dark:text-amber-400">
            Total Requests: {requests.length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by sender, recipient, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-in fade-in flex items-center justify-between">
            <span>✓ {msg}</span>
            <button onClick={() => setMsg('')} className="text-emerald-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Loading requests...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Send className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold">No collaboration requests found.</p>
              <p className="text-xs text-slate-500 mt-1">When students send requests to peers, they appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Sender (From)</th>
                    <th className="px-4 py-3">Recipient (To)</th>
                    <th className="px-4 py-3">Message Note</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{r.sender?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-400">{r.sender?.department} &bull; {r.sender?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{r.recipient?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-400">{r.recipient?.department} &bull; {r.recipient?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300 max-w-sm">
                        <span className="line-clamp-2 italic">"{r.message}"</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          r.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : r.status === 'rejected'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {r.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold"
                          title="Delete Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminRequests;
