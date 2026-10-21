import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../Components/AdminNavbar';
import { UsersRound, Trash2, Shield, Users, Loader2, Search } from 'lucide-react';
import { getAllTeamsAdmin, deleteTeamAdmin } from '../../API/admin';

export function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await getAllTeamsAdmin();
      if (res?.success) {
        setTeams(res.teams || []);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete team "${title}"?`)) return;
    try {
      const res = await deleteTeamAdmin(id);
      if (res?.success) {
        setTeams((prev) => prev.filter((t) => t._id !== id));
        setMsg(`Team "${title}" removed.`);
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {
      alert('Failed to delete team.');
    }
  };

  const filteredTeams = teams.filter((t) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.lead?.name && t.lead.name.toLowerCase().includes(q)) ||
      (t.tech && t.tech.some((tech) => tech.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Project Teams Directory</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              View student collaborative project groups, team leads, and technology stacks
            </p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold text-amber-500 dark:text-amber-400">
            Total Teams: {teams.length}
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
              placeholder="Search by team title, lead name, or tech..."
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
              <p className="text-xs text-slate-400 font-semibold">Loading teams...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <UsersRound className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold">No project teams created yet.</p>
              <p className="text-xs text-slate-500 mt-1">Teams formed by students will be listed here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTeams.map((team) => (
                <div
                  key={team._id}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-white text-base">{team.title}</h3>
                      <button
                        onClick={() => handleDelete(team._id, team.title)}
                        className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lead: <strong className="text-white">{team.lead?.name || 'Unknown'}</strong> ({team.lead?.department || 'Student'})</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>Members: {team.members?.length || 1} student(s)</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Tech Stack
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(team.tech || []).map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                    Created: {new Date(team.createdAt).toLocaleDateString()}
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

export default AdminTeams;
