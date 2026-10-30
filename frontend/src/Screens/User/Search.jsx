import React, { useState, useEffect } from 'react';
import Layout from '../../Components/Layout';
import {
  Users,
  Search as SearchIcon,
  Send,
  CheckCircle2,
  Filter,
  X,
  MapPin,
  Loader2,
  Sparkles,
  AlertCircle,
  Award,
  User,
  ArrowRight,
  Paperclip,
  FileText,
  Mail,
  RotateCcw,
} from 'lucide-react';
import { getPeers, sendCollaborationRequest } from '../../API/peers';
import { getMe } from '../../API/auth';
import PeerProfileModal from '../../Components/PeerProfileModal';
import { CURATED_SKILLS, DEPARTMENTS } from '../../data/skills';

const SKILL_TAGS = ['All', 'React', 'Node.js', 'Python', 'MERN', 'C++', 'Java', 'UI/UX'];

export function Search() {
  const [currentUser, setCurrentUser] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [requestTarget, setRequestTarget] = useState(null);
  const [requestRole, setRequestRole] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestFileUrl, setRequestFileUrl] = useState('');
  const [requestFileName, setRequestFileName] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState('');
  const [requestErr, setRequestErr] = useState('');
  const [viewingProfile, setViewingProfile] = useState(null);
  const [hideTeammates, setHideTeammates] = useState(false);

  const handleViewProfile = (candidate) => {
    setViewingProfile(candidate);
  };

  const fetchPeers = async () => {
    setLoading(true);
    try {
      const [peersData, meData] = await Promise.all([
        getPeers(),
        getMe().catch(() => null),
      ]);

      if (meData?.success && meData.user) {
        setCurrentUser(meData.user);
      }

      if (peersData?.success) {
        let peerList = peersData.peers || [];
        const myId = (meData?.user?._id || meData?.user?.id)?.toString();
        const myEmail = (meData?.user?.email || '').toLowerCase();
        if (myId || myEmail) {
          peerList = peerList.filter(
            (p) =>
              (p._id || p.id)?.toString() !== myId &&
              (!myEmail || (p.email || '').toLowerCase() !== myEmail)
          );
        }
        setCandidates(peerList);
      }
    } catch (err) {
      console.error('Failed to load peers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeers();
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    // Never show self in peer discovery
    if (
      currentUser &&
      ((c._id && (c._id === currentUser._id || c._id === currentUser.id)) ||
        (c.id && (c.id === currentUser._id || c.id === currentUser.id)) ||
        (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase()))
    ) {
      return false;
    }

    // Hide peers who are already your teammate only if the toggle is explicitly turned ON
    if (hideTeammates && c.isTeammate) return false;

    const term = (searchTerm || '').trim().toLowerCase();
    const cName = (c.name || '').toLowerCase();
    const cDept = (c.department || '').toLowerCase();
    const cSkills = Array.isArray(c.skills) ? c.skills : [];

    const matchesSearch =
      !term ||
      cName.includes(term) ||
      cDept.includes(term) ||
      cSkills.some((s) => (s || '').toLowerCase().includes(term));

    const matchesDept =
      selectedDept === 'All' ||
      cDept === selectedDept.toLowerCase();

    const matchesSkill =
      selectedSkill === 'All' ||
      cSkills.some((s) => (s || '').toLowerCase() === selectedSkill.toLowerCase());

    const matchesTag =
      selectedTag === 'All' ||
      cSkills.some((s) => (s || '').toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesDept && matchesSkill && matchesTag;
  });

  const handleSendRequest = async () => {
    if (!requestNote.trim() || !requestTarget) return;
    setSending(true);
    setRequestErr('');
    try {
      const res = await sendCollaborationRequest(
        requestTarget._id,
        requestNote.trim(),
        requestFileUrl.trim(),
        requestFileName.trim(),
        requestRole.trim()
      );
      if (res?.success) {
        setSentSuccess(true);
        setSentSuccessMsg(res.message || 'Collaboration request and email notification dispatched successfully!');
        setCandidates((prev) =>
          prev.map((c) => (c._id === requestTarget._id ? { ...c, hasRequested: true } : c))
        );
        setTimeout(() => {
          setRequestTarget(null);
          setRequestRole('');
          setRequestNote('');
          setRequestFileUrl('');
          setRequestFileName('');
          setSentSuccess(false);
          setSentSuccessMsg('');
        }, 3000);
      } else {
        setRequestErr(res.message || 'Failed to send collaboration request.');
      }
    } catch {
      setRequestErr('Connection error while sending request.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="p-6 sm:p-8 rounded-[32px] glass-panel text-white shadow-2xl space-y-2 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 text-amber-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 drop-shadow-[0_1px_4px_rgba(251,191,36,0.6)]" />
            <span>Open to Work Network</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Find Peers & Skill Partners</h1>
          <p className="text-white/70 text-sm font-medium">
            Discover verified peers looking for hackathons, project teams, and 1-on-1 collaboration.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-[28px] glass-panel-sub shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, department (BCA, BBA, MCA), or skill (React, Node.js)..."
                className="w-full pl-12 pr-4 py-3 glass-input-field rounded-2xl text-sm font-medium text-white placeholder-white/40"
              />
            </div>

            {/* Department Dropdown Filter */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3.5 py-3 glass-input-field rounded-2xl text-xs font-bold text-white cursor-pointer appearance-none pr-8"
              >
                <option value="All" className="bg-slate-900 text-white">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-slate-900 text-white">
                    {dept} Department
                  </option>
                ))}
              </select>
            </div>

            {/* Skills Dropdown Filter */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-3.5 py-3 glass-input-field rounded-2xl text-xs font-bold text-white cursor-pointer appearance-none pr-8"
              >
                <option value="All" className="bg-slate-900 text-white">All Skills</option>
                {CURATED_SKILLS.map((sk) => (
                  <option key={sk} value={sk} className="bg-slate-900 text-white">
                    {sk}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white/70 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-300" /> Quick Tags:
              </span>
              {SKILL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'glass-btn-cta text-slate-950 shadow-md scale-105'
                      : 'glass-pill text-white/80 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {candidates.some((c) => c.isTeammate) && (
                <button
                  type="button"
                  onClick={() => setHideTeammates(!hideTeammates)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                    hideTeammates
                      ? 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                      : 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
                  }`}
                  title={hideTeammates ? 'Show peers who are already in your teams' : 'Hide peers who are already in your teams'}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{hideTeammates ? 'Hide My Teammates' : 'Show All Teammates'}</span>
                </button>
              )}

              {(selectedDept !== 'All' || selectedSkill !== 'All' || selectedTag !== 'All' || searchTerm.trim()) && (
                <button
                  onClick={() => {
                    setSelectedDept('All');
                    setSelectedSkill('All');
                    setSelectedTag('All');
                    setSearchTerm('');
                  }}
                  className="px-3 py-1.5 rounded-xl glass-btn-ghost text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-amber-400/30"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
              <span className="text-white/60 text-xs font-medium px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                {filteredCandidates.length} peer{filteredCandidates.length === 1 ? '' : 's'} found
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs text-white/70 font-semibold">Loading open to work peers from database...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-8 rounded-[28px] glass-panel text-center text-white/70 text-sm font-medium shadow-xl">
            No other peer candidates found. As more students register, they will automatically appear here!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="p-6 rounded-[28px] glass-panel flex flex-col justify-between space-y-4 transition-all shadow-xl hover:bg-white/[0.12]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 text-amber-300 font-black flex items-center justify-center text-sm shadow-md">
                        {candidate.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base tracking-tight">{candidate.name}</h3>
                        <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5 font-medium">
                          <MapPin className="w-3 h-3 text-amber-300" /> {candidate.department}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-white/60 block">Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((skill) => (
                        <span key={skill} className="px-2.5 py-0.5 text-xs bg-white/10 border border-white/20 rounded-lg text-white font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {candidate.available}
                    </span>
                    {candidate.ranking && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-200 border border-amber-400/30">
                        <Award className="w-3 h-3 text-amber-300" /> {candidate.ranking}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/10">
                  {candidate.isTeammate || candidate.isAccepted ? (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleViewProfile(candidate)}
                        className="glass-btn-ghost w-full py-2.5 px-3 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-amber-300" /> View Candidate Profile
                      </button>
                      <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 rounded-xl text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-300" /> Connected Teammate
                      </div>
                    </div>
                  ) : candidate.hasRequested ? (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleViewProfile(candidate)}
                        className="glass-btn-ghost w-full py-2.5 px-3 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-amber-300" /> View Candidate Profile
                      </button>
                      <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Request already sent
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleViewProfile(candidate)}
                        className="glass-btn-cta w-full py-2.5 px-3 text-slate-950 text-xs font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" /> View Profile & Request
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                      <p className="text-[11px] text-center text-white/60 font-medium">
                        Open profile to inspect projects & send request
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {requestTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-[32px] glass-panel p-4 sm:p-7 shadow-2xl space-y-4 relative">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h3 className="text-base font-bold text-white tracking-tight">Request Help from {requestTarget.name}</h3>
                <button
                  onClick={() => setRequestTarget(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {sentSuccess ? (
                <div className="text-center py-6 space-y-2.5">
                  <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto drop-shadow-sm" />
                  <p className="font-bold text-white text-base">Request & Email Sent!</p>
                  <p className="text-xs text-white/80 font-medium max-w-sm mx-auto leading-relaxed">
                    {sentSuccessMsg || `An email notification has been dispatched to ${requestTarget.email || requestTarget.name}'s Gmail inbox. They will also see your request in CampusCollab.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl glass-tile text-xs text-white/90 space-y-1">
                    <p>Candidate: <strong className="text-white">{requestTarget.name}</strong></p>
                    <p>Department: <span className="font-semibold text-amber-300">{requestTarget.department}</span></p>
                    <p>Skills: <span className="font-semibold text-white/80">{requestTarget.skills.join(', ')}</span></p>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/25 text-amber-200 text-[11px] font-medium">
                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>An email notification will be dispatched to <strong>{requestTarget.email || requestTarget.name}</strong>'s Gmail inbox.</span>
                  </div>

                  {requestErr && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{requestErr}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/90">Discussion Topic / Role Focus (Optional)</label>
                    <input
                      type="text"
                      value={requestRole}
                      onChange={(e) => setRequestRole(e.target.value)}
                      placeholder="e.g. React Developer, UI/UX Review, Hackathon Partner"
                      className="w-full p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/90">Collaboration Note or Help Needed *</label>
                    <textarea
                      rows={3}
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      placeholder="Hi! I am working on a project and need someone skilled in your stack. Would you like to connect and discuss?"
                      className="w-full p-3 glass-input-field rounded-2xl text-xs text-white placeholder-white/40 font-medium resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-amber-300" />
                        <span>Project / Doc Link (Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={requestFileUrl}
                        onChange={(e) => setRequestFileUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-300" />
                        <span>File Title</span>
                      </label>
                      <input
                        type="text"
                        value={requestFileName}
                        onChange={(e) => setRequestFileName(e.target.value)}
                        placeholder="e.g. Project Spec.pdf"
                        className="w-full p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setRequestTarget(null)}
                      className="glass-btn-ghost flex-1 py-2.5 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!requestNote.trim() || sending}
                      onClick={handleSendRequest}
                      className="glass-btn-cta flex-1 py-2.5 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Request & Email...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Request & Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {viewingProfile && (
          <PeerProfileModal
            profile={viewingProfile}
            onClose={() => setViewingProfile(null)}
            onOpenSendRequest={(target) => {
              setViewingProfile(null);
              setRequestTarget(target);
              setRequestErr('');
              setSentSuccess(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

export default Search;
