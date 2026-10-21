import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../Components/AdminNavbar';
import { Users, Search, Trash2, Filter, Loader2, CheckCircle2 } from 'lucide-react';
import { getAllCandidates, deleteCandidate } from '../../API/admin';

export function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [msg, setMsg] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await getAllCandidates();
      if (res?.success) {
        setCandidates(res.users);
      }
    } catch {
      setMsg('Error loading candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove candidate "${name}"?`)) return;
    try {
      const res = await deleteCandidate(id);
      if (res?.success) {
        setCandidates((prev) => prev.filter((c) => c._id !== id));
        setMsg(`Removed candidate ${name} successfully.`);
        setTimeout(() => setMsg(''), 4000);
      }
    } catch {
      alert('Failed to delete candidate.');
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesDept = deptFilter === 'ALL' || c.department === deptFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.skills && c.skills.toLowerCase().includes(query));

    return matchesDept && matchesSearch;
  });

  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manage Candidates</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Search, filter, and oversee student records and admin accounts
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            Total Candidates: {candidates.filter((c) => c.role !== 'admin').length}
          </span>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Departments</option>
              <option value="BBA">BBA</option>
              <option value="BCA">BCA</option>
              <option value="MBA">MBA</option>
              <option value="MCA">MCA</option>
            </select>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Loading candidate records...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold">No candidates found matching your criteria.</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the search or department filter.</p>
            </div>
          ) : (
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
                  {filteredCandidates.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        <div>{c.name}</div>
                        <div className="text-xs text-slate-400 font-normal">{c.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                          {c.department || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300 max-w-sm truncate font-medium">
                        {c.skills || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                          c.role === 'admin' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {c.role === 'admin' ? 'Admin' : 'Student'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.role === 'admin' ? (
                          <span className="text-[11px] font-bold text-slate-500 px-2 py-1">Protected</span>
                        ) : (
                          <button
                            onClick={() => handleDelete(c._id, c.name)}
                            className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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

export default AdminCandidates;
