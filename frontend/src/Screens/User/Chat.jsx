import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../../Components/Layout';
import {
  MessageSquare,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  FolderGit2,
  CheckCircle2
} from 'lucide-react';
import { getTeams } from '../../API/teams';
import { getMe } from '../../API/auth';
import TeamChatBox from '../../Components/TeamChatBox';
const getTeamMemberCount = (team) => {
  if (!team) return 0;
  const ids = new Set();
  const leadId = (team.lead?._id || team.lead)?.toString();
  if (leadId) ids.add(leadId);
  (team.members || []).forEach((m) => {
    const id = (m?._id || m)?.toString();
    if (id) ids.add(id);
  });
  return ids.size || (team.members?.length || 1);
};

export function Chat() {
  const [searchParams] = useSearchParams();
  const preselectedTeamId = searchParams.get('teamId');

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [meRes, teamsRes] = await Promise.all([getMe(), getTeams()]);

        if (!isMounted) return;

        if (meRes?.success && meRes.user) {
          setCurrentUser(meRes.user);
        }

        if (teamsRes?.success && Array.isArray(teamsRes.teams)) {
          // Filter to teams where user is lead or member
          const myTeams = teamsRes.teams.filter((t) => t.isMember || t.isLead);
          setTeams(myTeams);

          if (myTeams.length > 0) {
            if (preselectedTeamId) {
              const matched = myTeams.find(
                (t) => (t._id || t.id).toString() === preselectedTeamId.toString()
              );
              setSelectedTeam(matched || myTeams[0]);
            } else {
              setSelectedTeam(myTeams[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [preselectedTeamId]);

  const filteredTeams = teams.filter((t) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      (Array.isArray(t.tech) ? t.tech : (t.tech || '').split(',')).some((tech) =>
        tech.toLowerCase().includes(q)
      )
    );
  });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        
        {/* Header Glass Panel */}
        <div className="p-6 sm:p-8 rounded-[32px] glass-panel relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 mb-3">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Encrypted Team Channels</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Team Live Chat &amp; File Sharing
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-xl">
                Collaborate in real-time with your project teammates. Send text messages, share screenshots &amp; documents, post syntax-tagged code snippets, and launch live video standups.
              </p>
            </div>

            <Link
              to="/teams"
              className="px-4 py-2.5 rounded-2xl glass-btn-ghost text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all shrink-0 self-start md:self-auto cursor-pointer"
            >
              <span>Manage Teams &amp; Kanban</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="h-96 rounded-[32px] glass-panel flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-9 h-9 animate-spin text-blue-600 dark:text-sky-400" />
            <p className="text-xs font-semibold">Loading your team channels...</p>
          </div>
        ) : teams.length === 0 ? (
          /* Empty state: User has no teams yet */
          <div className="rounded-[32px] glass-panel p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                No Active Team Channels Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Team live chat and file sharing is isolated to members of active projects. Create a new team or request to join an existing project to unlock instant chat rooms!
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/teams"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass-btn-cta text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Go to Teams Page</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Two-column Chat Workspace: Left Sidebar + Right Chat Stream */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Team Channel Selector */}
            <div className="lg:col-span-4 rounded-[32px] glass-panel p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    My Project Channels ({teams.length})
                  </h3>
                </div>
              </div>

              {/* Search Channels */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter channels..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl glass-input-field text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                />
              </div>

              {/* Channels List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredTeams.map((t) => {
                  const isSelected = (selectedTeam?._id || selectedTeam?.id) === (t._id || t.id);
                  const isLead = t.isLead;

                  return (
                    <button
                      key={t._id || t.id}
                      onClick={() => setSelectedTeam(t)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-500'
                          : 'glass-tile text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-transparent'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {t.title}
                          </span>
                          {isLead && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              Lead
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] truncate font-medium ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          {getTeamMemberCount(t)} {getTeamMemberCount(t) === 1 ? 'member' : 'members'} &bull; {Array.isArray(t.tech) ? t.tech.slice(0, 2).join(', ') : t.tech || 'Project'}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Chat Box */}
            <div className="lg:col-span-8">
              {selectedTeam ? (
                <TeamChatBox
                  key={selectedTeam._id || selectedTeam.id}
                  team={selectedTeam}
                  currentUser={currentUser}
                />
              ) : (
                <div className="h-[600px] rounded-[32px] glass-panel flex flex-col items-center justify-center gap-2 text-center p-6 text-slate-400">
                  <MessageSquare className="w-10 h-10 text-slate-400" />
                  <p className="text-xs font-semibold">Select a team channel from the left to start messaging.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}

export default Chat;
