import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../../Components/Layout';
import {
  Users,
  Plus,
  CheckCircle2,
  Shield,
  FolderGit2,
  X,
  Loader2,
  UserPlus,
  Search,
  Send,
  AlertCircle,
  Check,
  Compass,
  Clock,
  ExternalLink,
  Trash2,
  Kanban,
  MessageSquare,
  Lock
} from 'lucide-react';
import { getTeams, createNewTeam, invitePeerToTeam, requestToJoinTeam, cancelJoinRequest } from '../../API/teams';
import { getPeers } from '../../API/peers';
import { getMe } from '../../API/auth';
import TeamKanbanBoard from '../../Components/TeamKanbanBoard';

const getUniqueTeamMembers = (team) => {
  if (!team) return [];
  const map = new Map();
  if (team.lead) {
    const leadId = (team.lead._id || team.lead)?.toString();
    if (leadId) map.set(leadId, typeof team.lead === 'object' ? team.lead : { _id: leadId, name: 'Lead' });
  }
  (team.members || []).forEach((m) => {
    if (m) {
      const id = (m._id || m)?.toString();
      if (id && !map.has(id)) {
        map.set(id, typeof m === 'object' ? m : { _id: id, name: 'Member' });
      }
    }
  });
  return Array.from(map.values());
};

const getTeamMemberCount = (team) => {
  if (!team) return 0;
  return getUniqueTeamMembers(team).length || (team.members?.length || 1);
};

export function Teams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const createParam = searchParams.get('create');
  const candidateIdParam = searchParams.get('candidateId');
  const candidateNameParam = searchParams.get('candidateName');

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my'
  const [teamSearch, setTeamSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ title: '', tech: '', description: '', githubUrl: '', openRoles: '' });
  const [actionMsg, setActionMsg] = useState('');
  const [selectedKanbanTeam, setSelectedKanbanTeam] = useState(null);
  const [kanbanInitialView, setKanbanInitialView] = useState('kanban');

  const openTeamWorkspace = (team, view = 'kanban') => {
    const isMember = team.isMember || team.isLead;
    setSelectedKanbanTeam(team);
    setKanbanInitialView(!isMember && view === 'chat' ? 'kanban' : view);
  };

  // Add Member to Specific Team Modal State (Team Lead/Member inviting peer)
  const [inviteModalTeam, setInviteModalTeam] = useState(null);
  const [peers, setPeers] = useState([]);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [peerSearch, setPeerSearch] = useState('');
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [inviteRole, setInviteRole] = useState('Frontend Developer');
  const [inviteNote, setInviteNote] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Request to Join Team Modal State (Peer requesting to join existing team)
  const [joinModalTeam, setJoinModalTeam] = useState(null);
  const [joinRole, setJoinRole] = useState('Contributor');
  const [joinNote, setJoinNote] = useState('');
  const [sendingJoinRequest, setSendingJoinRequest] = useState(false);
  const [joinError, setJoinError] = useState('');

  const fetchTeamsData = async () => {
    setLoading(true);
    try {
      const [teamsData, meData] = await Promise.all([getTeams(), getMe()]);
      if (meData?.success && meData.user) {
        setCurrentUser(meData.user);
      }
      if (teamsData?.success) {
        setTeams(teamsData.teams || []);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsData();
    if (createParam === 'true') {
      setShowCreateModal(true);
      if (candidateNameParam) {
        setActionMsg(`Create your team to add ${candidateNameParam} as a member.`);
      }
    }
  }, [createParam, candidateNameParam]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.title) return;
    try {
      const payload = {
        ...newTeam,
        candidateId: candidateIdParam || undefined,
      };
      const data = await createNewTeam(payload);
      if (data?.success) {
        setShowCreateModal(false);
        setNewTeam({ title: '', tech: '', description: '', githubUrl: '', openRoles: '' });
        setActionMsg(
          candidateNameParam
            ? `Team "${data.team?.title || newTeam.title}" created successfully and ${candidateNameParam} has been added!`
            : `Team "${data.team?.title || newTeam.title}" created successfully! You can now invite members with specific roles.`
        );
        setTimeout(() => setActionMsg(''), 6000);
        if (createParam) {
          setSearchParams({});
        }
        fetchTeamsData();
      } else {
        alert(data?.message || 'Failed to create team.');
      }
    } catch (err) {
      console.error('Failed to create team:', err);
      alert(err?.message || 'Failed to create team. Please try again.');
    }
  };

  // 1. Open Invite Modal (Team lead/member adds a peer)
  const openInviteModal = async (team) => {
    setInviteModalTeam(team);
    setSelectedPeer(null);
    setPeerSearch('');
    const defaultRole = team.openRoles && team.openRoles.length > 0 ? team.openRoles[0] : 'Team Contributor';
    setInviteRole(defaultRole);
    setInviteNote(`Hi! I'd like to invite you to join our project team "${team.title}" as ${defaultRole}.`);
    setInviteError('');

    if (peers.length === 0) {
      setLoadingPeers(true);
      try {
        const res = await getPeers();
        if (res?.success) {
          setPeers(res.peers || []);
        }
      } catch (err) {
        console.error('Failed to load peer list:', err);
      } finally {
        setLoadingPeers(false);
      }
    }
  };

  const handleSendTeamInvite = async (e) => {
    if (e) e.preventDefault();
    if (!inviteModalTeam || !selectedPeer) {
      setInviteError('Please select a specific peer to invite.');
      return;
    }

    setSendingInvite(true);
    setInviteError('');
    try {
      const res = await invitePeerToTeam(
        inviteModalTeam._id || inviteModalTeam.id,
        selectedPeer._id || selectedPeer.id,
        inviteNote,
        inviteRole
      );

      if (res?.success) {
        setActionMsg(res.message || `Invitation delivered to ${selectedPeer.name} for team "${inviteModalTeam.title}" as ${inviteRole}!`);
        setTimeout(() => setActionMsg(''), 7000);
        setInviteModalTeam(null);
        setSelectedPeer(null);
      } else {
        setInviteError(res?.message || 'Failed to send team invitation.');
      }
    } catch (err) {
      console.error('Invite error:', err);
      setInviteError('Network error while dispatching team invitation.');
    } finally {
      setSendingInvite(false);
    }
  };

  // 2. Open Join Modal (Peer requests to join existing team)
  const openJoinModal = (team) => {
    setJoinModalTeam(team);
    const defaultRole = team.openRoles && team.openRoles.length > 0 ? team.openRoles[0] : 'Contributor';
    setJoinRole(defaultRole);
    setJoinNote(`Hi ${team.lead?.name || 'Lead'}, I would love to join your project team "${team.title}" as ${defaultRole} and contribute!`);
    setJoinError('');
  };

  const handleSendJoinRequest = async (e) => {
    if (e) e.preventDefault();
    if (!joinModalTeam) return;

    setSendingJoinRequest(true);
    setJoinError('');
    try {
      const res = await requestToJoinTeam(
        joinModalTeam._id || joinModalTeam.id,
        joinNote,
        joinRole
      );

      if (res?.success) {
        setActionMsg(res.message || `Join request sent to ${joinModalTeam.lead?.name || 'the team lead'}! An email notification has been dispatched.`);
        setTimeout(() => setActionMsg(''), 7000);

        // Update local team status to hasRequested
        setTeams((prev) =>
          prev.map((t) =>
            (t._id || t.id) === (joinModalTeam._id || joinModalTeam.id)
              ? { ...t, hasRequested: true }
              : t
          )
        );

        setJoinModalTeam(null);
      } else {
        setJoinError(res?.message || 'Failed to send join request.');
      }
    } catch (err) {
      console.error('Join request error:', err);
      setJoinError('Network error while dispatching join request.');
    } finally {
      setSendingJoinRequest(false);
    }
  };

  const handleCancelJoinRequest = async (team) => {
    if (!window.confirm(`Withdraw and delete your request to join "${team.title}"?`)) return;
    try {
      const res = await cancelJoinRequest(team._id || team.id);
      if (res?.success) {
        setActionMsg(res.message || 'Join request withdrawn and deleted from database.');
        setTimeout(() => setActionMsg(''), 5000);
        setTeams((prev) =>
          prev.map((t) =>
            (t._id || t.id) === (team._id || team.id)
              ? { ...t, hasRequested: false }
              : t
          )
        );
      } else {
        alert(res?.message || 'Failed to cancel join request.');
      }
    } catch {
      alert('Error cancelling join request.');
    }
  };

  const isMemberOfTeam = (team, peerId) => {
    if (!team || !peerId) return false;
    const pIdStr = peerId.toString();
    const leadId = team.lead?._id ? team.lead._id.toString() : team.lead?.toString();
    if (leadId === pIdStr) return true;
    return (team.members || []).some((m) => {
      const mId = m?._id ? m._id.toString() : m?.toString();
      return mId === pIdStr;
    });
  };

  // Filter peers in the invite modal
  const filteredPeers = peers.filter((p) => {
    if (!peerSearch.trim()) return true;
    const query = peerSearch.toLowerCase();
    const matchName = p.name?.toLowerCase().includes(query);
    const matchDept = p.department?.toLowerCase().includes(query);
    const matchSkills = (p.skills || []).some((s) => s.toLowerCase().includes(query));
    return matchName || matchDept || matchSkills;
  });

  // Filter teams by active tab & search
  const myTeamsCount = teams.filter((t) => t.isMember || t.isLead).length;
  const filteredTeams = teams
    .filter((team) => {
      if (activeTab === 'my') {
        return team.isMember || team.isLead;
      }
      return true;
    })
    .filter((team) => {
      if (!teamSearch.trim()) return true;
      const q = teamSearch.toLowerCase();
      const matchTitle = team.title?.toLowerCase().includes(q);
      const matchDesc = team.description?.toLowerCase().includes(q);
      const matchLead = team.lead?.name?.toLowerCase().includes(q);
      const matchTech = (Array.isArray(team.tech) ? team.tech : (team.tech || '').split(',')).some((t) =>
        t.toLowerCase().includes(q)
      );
      return matchTitle || matchDesc || matchLead || matchTech;
    });

  return (
    <Layout>
      {selectedKanbanTeam ? (
        <TeamKanbanBoard
          key={`${selectedKanbanTeam._id || selectedKanbanTeam.id}_${kanbanInitialView}`}
          team={selectedKanbanTeam}
          currentUser={currentUser}
          initialView={kanbanInitialView}
          onClose={() => setSelectedKanbanTeam(null)}
          onTeamUpdated={(updatedTeam) => {
            setSelectedKanbanTeam(updatedTeam);
            setTeams((prev) =>
              prev.map((t) =>
                (t._id || t.id) === (updatedTeam._id || updatedTeam.id)
                  ? { ...t, ...updatedTeam, tasks: updatedTeam.tasks || [] }
                  : t
              )
            );
          }}
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
        {/* Header Glass Panel */}
        <div className="p-6 sm:p-8 rounded-[32px] glass-panel text-white shadow-2xl flex justify-between items-center flex-wrap gap-4 relative overflow-hidden">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Campus Project Squads</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Collaboration Teams & Projects
            </h1>
            <p className="text-white/70 text-xs sm:text-sm mt-1 font-medium">
              Explore active project teams, request to join squads, or create your own team and invite peers.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="glass-btn-cta px-4 py-2.5 rounded-2xl text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Team
          </button>
        </div>

        {/* Action Notifications */}
        {actionMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5 backdrop-blur-md animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Controls Bar: Tabs & Search Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tab Switcher */}
          <div className="glass-panel-sub p-1.5 rounded-2xl flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer select-none ${
                activeTab === 'all'
                  ? 'glass-btn-cta text-slate-950 font-black shadow-lg shadow-orange-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Teams</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${activeTab === 'all' ? 'bg-black/20 text-slate-950 font-bold' : 'bg-white/15 text-white/80'}`}>
                {teams.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer select-none ${
                activeTab === 'my'
                  ? 'glass-btn-cta text-slate-950 font-black shadow-lg shadow-orange-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>My Teams</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${activeTab === 'my' ? 'bg-black/20 text-slate-950 font-bold' : 'bg-white/15 text-white/80'}`}>
                {myTeamsCount}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="Search teams by name, skill, lead..."
              className="w-full pl-10 pr-4 py-2.5 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium"
            />
          </div>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs text-white/70 font-semibold">Loading campus teams & squads...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-10 rounded-[32px] glass-panel text-center text-white/70 space-y-3 shadow-xl">
            <Users className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
            <h2 className="text-base font-bold text-white">
              {activeTab === 'my' ? 'You have not joined any teams yet' : 'No matching teams found'}
            </h2>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              {activeTab === 'my'
                ? 'Switch to "Explore All Teams" to discover teams to join, or click "Create New Team" to build your own squad!'
                : 'Try adjusting your search keywords, or be the first to create this team!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeams.map((team) => (
              <div
                key={team._id || team.id}
                className="p-6 rounded-[28px] glass-panel space-y-4 flex flex-col justify-between shadow-xl hover:bg-white/[0.12] transition-all border border-white/15"
              >
                <div className="space-y-3.5">
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40">
                          Project Team
                        </span>
                        {team.tasks && team.tasks.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full glass-tile text-blue-600 dark:text-sky-400 border border-blue-500/20 flex items-center gap-1">
                            <Kanban className="w-2.5 h-2.5" />
                            <span>{team.tasks.filter((t) => t.status === 'done').length}/{team.tasks.length} tasks</span>
                          </span>
                        )}
                        {team.isLead ? (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                            You are Lead
                          </span>
                        ) : team.isMember ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Member
                          </span>
                        ) : team.hasRequested ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Requested
                          </span>
                        ) : null}
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1.5 tracking-tight">{team.title}</h2>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {team.status || 'Active'}
                    </span>
                  </div>

                  {team.description && (
                    <p className="text-xs text-white/80 leading-relaxed font-medium">
                      {team.description}
                    </p>
                  )}

                  {/* Team Lead & Members Glass Box */}
                  <div className="space-y-2.5 glass-tile p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <p className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-300" /> Team Lead:{' '}
                        <span className="text-white font-semibold">
                          {team.lead?.name || 'Student Lead'}
                        </span>
                      </p>
                      <span className="text-[11px] text-white/50">{team.lead?.department || 'Lead'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-white/50" /> Members ({getTeamMemberCount(team)}):
                      </p>

                      {/* ADD MEMBER BUTTON (Only visible to Team Lead or Members) */}
                      {(team.isLead || team.isMember) && (
                        <button
                          onClick={() => openInviteModal(team)}
                          className="glass-btn-cta px-3 py-1.5 rounded-xl text-slate-950 font-black text-[11px] shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                          title={`Request and invite a specific peer to join ${team.title}`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Member</span>
                        </button>
                      )}
                    </div>

                    {/* Member chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {getUniqueTeamMembers(team).map((m, idx) => {
                        const mId = m?._id ? m._id.toString() : m?.toString();
                        const leadId = team.lead?._id ? team.lead._id.toString() : team.lead?.toString();
                        const isLead = leadId === mId;
                        return (
                          <div
                            key={idx}
                            className={`px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 ${
                              isLead
                                ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30 font-bold'
                                : 'bg-white/10 text-white/90 border border-white/15 font-medium'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>{m.name || 'Member'}</span>
                            {isLead && <span className="text-[10px] text-amber-300 font-extrabold uppercase">(Lead)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Required Roles Needed (Phase 4) */}
                  {team.openRoles && team.openRoles.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        <span>Open Roles Needed</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {team.openRoles.map((r, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 text-xs bg-amber-400/15 border border-amber-300/30 rounded-lg font-bold text-amber-200"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack Pills */}
                  {team.tech && team.tech.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
                        Tech Stack
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(team.tech) ? team.tech : team.tech.split(',')).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 text-xs bg-white/10 border border-white/20 rounded-lg font-medium text-white/90"
                          >
                            {typeof t === 'string' ? t.trim() : t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls: GitHub link and Membership Actions */}
                <div className="pt-3 border-t border-white/10 flex justify-between items-center gap-3">
                  {team.githubUrl ? (
                    <a
                      href={team.githubUrl.startsWith('http') ? team.githubUrl : `https://${team.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1.5 transition-colors"
                      title="Open GitHub Repository"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      <span>GitHub Repo &rarr;</span>
                    </a>
                  ) : (
                    <span className="text-xs text-white/50 font-medium flex items-center gap-1">
                      <FolderGit2 className="w-3.5 h-3.5" /> No Repository
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openTeamWorkspace(team, 'kanban')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-sky-400 dark:hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Open Team Project Kanban Board"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span>Kanban ({team.tasks?.length || 0})</span>
                    </button>

                    {team.isLead || team.isMember ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openTeamWorkspace(team, 'chat')}
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="Open Team Live Chat Workspace"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                        <Link
                          to={`/chat?teamId=${team._id || team.id}`}
                          className="p-1.5 rounded-xl glass-tile text-emerald-400 hover:text-white hover:bg-emerald-600/20 transition-all cursor-pointer"
                          title="Open Dedicated Fullscreen Chat Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (team.hasRequested) {
                            setActionMsg(`Your join request for "${team.title}" is pending approval. Chat unlocks once accepted!`);
                          } else {
                            setActionMsg(`Team chat & files are private to members. Request to join "${team.title}" to unlock chat!`);
                          }
                          setTimeout(() => setActionMsg(''), 6000);
                        }}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 hover:text-slate-200 dark:text-slate-400 font-semibold text-xs flex items-center gap-1.5 border border-white/5 hover:border-amber-400/30 transition-all cursor-pointer group shadow-sm"
                        title={team.hasRequested ? "Join request pending — Chat unlocks once accepted" : "Members only — Request to join to unlock live chat"}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
                        <span>Chat</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/5 text-amber-300/80 font-bold border border-white/10 hidden sm:inline-block">
                          Members
                        </span>
                      </button>
                    )}

                    {/* If user is lead or member -> Invite Peer button */}
                    {team.isLead || team.isMember ? (
                      <button
                        onClick={() => openInviteModal(team)}
                        className="text-xs font-bold text-white/80 hover:text-white flex items-center gap-1 underline underline-offset-4 decoration-amber-400/50 hover:decoration-amber-400 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Invite</span>
                      </button>
                    ) : team.hasRequested ? (
                      /* If user has already requested to join */
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-300/90 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Request Sent</span>
                        </span>
                        <button
                          onClick={() => handleCancelJoinRequest(team)}
                          className="text-xs font-bold text-red-300 hover:text-red-200 px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                          title="Withdraw and delete your join request from database"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Withdraw</span>
                        </button>
                      </div>
                    ) : (
                      /* If user is not in team -> REQUEST TO JOIN BUTTON */
                      <button
                        onClick={() => openJoinModal(team)}
                        className="glass-btn-cta px-3.5 py-1.5 rounded-xl text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        title={`Send a request to join ${team.title}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Join</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL 1: Create New Team */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-2xl p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-[32px] glass-panel p-6 sm:p-7 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h3 className="text-base font-bold text-white tracking-tight">Create New Collaboration Team</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-4">
                {candidateNameParam && (
                  <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{candidateNameParam}</strong> will automatically be added as a team member upon creation.</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Project Name / Title *</label>
                  <input
                    type="text"
                    required
                    value={newTeam.title}
                    onChange={(e) => setNewTeam({ ...newTeam, title: e.target.value })}
                    placeholder="e.g. AI Code Assistant"
                    className="w-full p-3 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Brief overview of what this team is building..."
                    className="w-full p-3 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    value={newTeam.tech}
                    onChange={(e) => setNewTeam({ ...newTeam, tech: e.target.value })}
                    placeholder="e.g. React, Node.js, Express, Tailwind"
                    className="w-full p-3 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Roles Needed (comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={newTeam.openRoles}
                    onChange={(e) => setNewTeam({ ...newTeam, openRoles: e.target.value })}
                    placeholder="e.g. Frontend Developer, UI Designer, Backend Engineer"
                    className="w-full p-3 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/90 mb-1.5">GitHub Repository Link</label>
                  <input
                    type="url"
                    value={newTeam.githubUrl}
                    onChange={(e) => setNewTeam({ ...newTeam, githubUrl: e.target.value })}
                    placeholder="https://github.com/username/repository-name"
                    className="w-full p-3 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="glass-btn-ghost flex-1 py-2.5 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="glass-btn-cta flex-1 py-2.5 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Add Member to Specific Team (Team Lead inviting peer) */}
        {inviteModalTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xl p-4 animate-fade-in">
            <div className="w-full max-w-lg rounded-[32px] glass-panel p-6 sm:p-7 shadow-2xl space-y-4 relative border border-white/30 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-start pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl glass-tile text-amber-300 border border-amber-300/30">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Add Member to "{inviteModalTeam.title}"
                    </h3>
                    <p className="text-xs text-white/70">
                      Search and invite a specific peer candidate to join this team.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInviteModalTeam(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inviteError && (
                <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-semibold backdrop-blur-md flex items-center gap-2 shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
                  <span>{inviteError}</span>
                </div>
              )}

              {/* Peer Search Input */}
              <div className="space-y-1.5 shrink-0">
                <label className="text-xs font-bold text-white/90 block">Select Specific Peer</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={peerSearch}
                    onChange={(e) => setPeerSearch(e.target.value)}
                    placeholder="Search by peer name, department, or skill (e.g. React)..."
                    className="w-full pl-10 pr-4 py-2.5 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium"
                  />
                </div>
              </div>

              {/* Peer Selection List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-52 min-h-36">
                {loadingPeers ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    <span className="text-xs text-white/60">Loading peer candidates...</span>
                  </div>
                ) : filteredPeers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-white/60">
                    No matching peers found.
                  </div>
                ) : (
                  filteredPeers.map((peer) => {
                    const peerId = peer._id || peer.id;
                    const isAlreadyMember = isMemberOfTeam(inviteModalTeam, peerId);
                    const isSelected = (selectedPeer?._id || selectedPeer?.id) === peerId;

                    return (
                      <div
                        key={peerId}
                        onClick={() => {
                          if (!isAlreadyMember) {
                            setSelectedPeer(peer);
                            setInviteError('');
                          }
                        }}
                        className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                          isAlreadyMember
                            ? 'opacity-50 cursor-not-allowed bg-white/5 border border-white/5'
                            : isSelected
                            ? 'bg-amber-400/20 border-2 border-amber-300 shadow-md cursor-pointer'
                            : 'glass-tile hover:bg-white/[0.12] border border-white/10 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                            {peer.name?.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white truncate">{peer.name}</h4>
                              <span className="text-[10px] text-white/60">({peer.department || 'Student'})</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {(peer.skills || []).slice(0, 3).map((s, idx) => (
                                <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/80">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isAlreadyMember ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10">
                              Already in Team
                            </span>
                          ) : isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="text-xs font-bold text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20 transition-all cursor-pointer"
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Peer Info & Invite Note */}
              {selectedPeer && (
                <div className="space-y-3 pt-2 border-t border-white/10 shrink-0">
                  <div className="flex items-center justify-between text-xs text-white/90 bg-emerald-500/10 border border-emerald-400/30 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Selected: <strong className="text-white">{selectedPeer.name}</strong> ({selectedPeer.email})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPeer(null)}
                      className="text-[10px] text-white/60 hover:text-white underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-300 block">Specific Role to Assign in Team *</label>
                    <input
                      type="text"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      placeholder="e.g. UI/UX Designer, Embedded C++ Dev, Backend Lead"
                      className="w-full p-2.5 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/90 block">Invitation Message (Nodemailer Email)</label>
                    <textarea
                      rows={2}
                      value={inviteNote}
                      onChange={(e) => setInviteNote(e.target.value)}
                      placeholder="Include details about the role or project in the invitation..."
                      className="w-full p-2.5 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setInviteModalTeam(null)}
                  className="glass-btn-ghost flex-1 py-2.5 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedPeer || sendingInvite}
                  onClick={handleSendTeamInvite}
                  className="glass-btn-cta flex-1 py-2.5 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {sendingInvite ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Invitation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Team Invitation Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Request to Join Team Modal (Peer applying to join existing team) */}
        {joinModalTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xl p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-[32px] glass-panel p-6 sm:p-7 shadow-2xl space-y-4 relative border border-white/30 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl glass-tile text-amber-300 border border-amber-300/30">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Request to Join "{joinModalTeam.title}"
                    </h3>
                    <p className="text-xs text-white/70">
                      Send a join request with an email notification to team lead {joinModalTeam.lead?.name || 'Lead'}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setJoinModalTeam(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {joinError && (
                <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-semibold backdrop-blur-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
                  <span>{joinError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl glass-tile border border-white/10 space-y-1.5 text-xs text-white/80">
                <p>
                  <strong>Team Lead:</strong> {joinModalTeam.lead?.name} ({joinModalTeam.lead?.email})
                </p>
                {joinModalTeam.tech && (
                  <p>
                    <strong>Tech Stack:</strong>{' '}
                    {Array.isArray(joinModalTeam.tech) ? joinModalTeam.tech.join(', ') : joinModalTeam.tech}
                  </p>
                )}
              </div>

              {joinModalTeam.openRoles && joinModalTeam.openRoles.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-300 block">Open Roles in this Project:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {joinModalTeam.openRoles.map((roleName, rIdx) => (
                      <button
                        key={rIdx}
                        type="button"
                        onClick={() => setJoinRole(roleName)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          joinRole === roleName
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-sm'
                            : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
                        }`}
                      >
                        + {roleName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 block">Role You Are Applying For *</label>
                <input
                  type="text"
                  required
                  value={joinRole}
                  onChange={(e) => setJoinRole(e.target.value)}
                  placeholder="e.g. Frontend Developer, UI Designer, Backend Dev"
                  className="w-full p-2.5 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/90 block">Message to Team Lead *</label>
                <textarea
                  rows={3}
                  value={joinNote}
                  onChange={(e) => setJoinNote(e.target.value)}
                  placeholder="Introduce yourself, your skills, and why you'd like to join..."
                  className="w-full p-3 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalTeam(null)}
                  disabled={sendingJoinRequest}
                  className="glass-btn-ghost flex-1 py-2.5 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={sendingJoinRequest || !joinNote.trim()}
                  onClick={handleSendJoinRequest}
                  className="glass-btn-cta flex-1 py-2.5 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {sendingJoinRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Request & Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </Layout>
  );
}

export default Teams;

