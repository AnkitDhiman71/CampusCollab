import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNavbar from '../../Components/AdminNavbar';
import { Users, ShieldCheck, BookOpen, Loader2, Trash2, Send, UsersRound, MessageSquare, ShieldAlert, Code2 } from 'lucide-react';
import { getAdminStats, getAllCandidates, deleteCandidate } from '../../API/admin';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        getAdminStats(),
        getAllCandidates()
      ]);

      if (statsRes?.success) {
        setStats(statsRes.stats);
      }
      if (usersRes?.success) {
        setRecentUsers(usersRes.users.slice(0, 6));
      }
    } catch {
      setError('Failed to load admin statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      const res = await deleteCandidate(id);
      if (res?.success) {
        loadData();
      }
    } catch {
      alert('Failed to delete candidate.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Overview</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Monitor registered candidates, collaboration requests, project teams, questions bank, and contact queries</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/candidates"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Candidates</span>
            </Link>
            <Link
              to="/admin/questions"
              className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-bold text-xs rounded-xl border border-blue-500/30 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Questions Bank</span>
            </Link>
            <Link
              to="/admin/logs"
              className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 font-bold text-xs rounded-xl border border-red-500/30 transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Security Logs</span>
            </Link>
            <Link
              to="/admin/requests"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Requests</span>
            </Link>
            <Link
              to="/admin/teams"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <UsersRound className="w-3.5 h-3.5" />
              <span>Teams</span>
            </Link>
            <Link
              to="/admin/queries"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Queries</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Loading admin statistics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <Link to="/admin/candidates" className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Candidates</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.studentCount || 0}</div>
                <p className="text-[10px] text-slate-500">Students registered</p>
              </Link>

              <Link to="/admin/questions" className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1 hover:border-blue-500/40 transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Questions</span>
                  <Code2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-blue-400">{stats?.totalQuestions ?? 0}</div>
                <p className="text-[10px] text-slate-500">Assessment bank</p>
              </Link>

              <Link to="/admin/requests" className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Requests</span>
                  <Send className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">{stats?.totalRequests || 0}</div>
                <p className="text-[10px] text-slate-500">Peer collaborations</p>
              </Link>

              <Link to="/admin/teams" className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Teams</span>
                  <UsersRound className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400">{stats?.totalTeams || 0}</div>
                <p className="text-[10px] text-slate-500">Active project groups</p>
              </Link>

              <Link to="/admin/queries" className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Inquiries</span>
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">{stats?.totalInquiries || 0}</div>
                <p className="text-[10px] text-slate-500">Contact queries</p>
              </Link>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Branches</span>
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-400">{stats?.departments?.length || 0}</div>
                <p className="text-[10px] text-slate-500">Active branches</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" /> Department Breakdown
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats?.departments?.length > 0 ? (
                  stats.departments.map((dept) => (
                    <div key={dept._id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase">{dept._id || 'General'}</div>
                      <div className="text-2xl font-black text-white mt-1">{dept.count}</div>
                      <span className="text-[10px] text-slate-400 font-semibold">candidates</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 col-span-4">No department statistics available yet.</p>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Recent Candidate Registrations
                </h2>
                <Link to="/admin/candidates" className="text-xs font-bold text-amber-400 hover:underline">
                  View All Candidates →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Skills</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recentUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">
                          <div>{u.name}</div>
                          <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                            {u.department}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300 max-w-xs truncate font-medium">
                          {u.skills || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                            u.role === 'admin' 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : 'Student'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(u._id, u.name)}
                            className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
