import React, { useState, useEffect } from 'react';
import Layout from '../../Components/Layout';
import {
  User,
  Mail,
  GraduationCap,
  Code,
  CheckCircle2,
  Edit3,
  Save,
  Loader2,
  Award,
  Briefcase,
  FolderGit2,
  Star,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  RefreshCw,
  GitFork,
} from 'lucide-react';
import { getMe, updateUserProfile } from '../../API/auth';
import { getLiveGitHubData } from '../../API/peers';
import { CURATED_SKILLS } from '../../data/skills';

const GithubIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const INITIAL_PROFILE = {
  name: '',
  email: '',
  department: 'General',
  bio: '',
  skills: [],
  githubUrl: '',
  ranking: '🌱 Rising Contributor',
  rankingPoints: 500,
  openToWork: true,
  projects: [],
  repositories: [],
  githubStats: null,
};

export function Profile() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [skillSelect, setSkillSelect] = useState('');

  // Live GitHub Sync state
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Form states for adding new projects & custom repos
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', tech: '', description: '', link: '' });

  const [showAddRepo, setShowAddRepo] = useState(false);
  const [newRepo, setNewRepo] = useState({ name: '', language: 'JavaScript', description: '', url: '', stars: 0 });

  useEffect(() => {
    getMe()
      .then((data) => {
        if (data?.success && data.user) {
          const u = data.user;
          setProfile({
            name: u.name || '',
            email: u.email || '',
            department: u.department || 'General',
            bio: u.bio || '',
            skills: u.skills ? u.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
            githubUrl: u.githubUrl || '',
            ranking: u.ranking || '🌱 Rising Contributor',
            rankingPoints: u.rankingPoints || 500,
            openToWork: u.openToWork !== false,
            projects: u.projects || [],
            repositories: u.repositories || [],
            githubStats: u.githubStats || null,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleOpenToWork = async () => {
    const updatedStatus = !profile.openToWork;
    setProfile((prev) => ({ ...prev, openToWork: updatedStatus }));
    try {
      const res = await updateUserProfile({ openToWork: updatedStatus });
      if (res?.success) {
        setSaveMsg(updatedStatus ? 'You are now marked Available for projects & mentorship!' : 'You are now marked busy / in a project.');
        setTimeout(() => setSaveMsg(''), 4000);
      }
    } catch {
      setProfile((prev) => ({ ...prev, openToWork: !updatedStatus }));
      alert('Failed to update availability status.');
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSyncGitHub = async (customHandle) => {
    const target = customHandle || profile.githubUrl;
    if (!target || !target.trim()) {
      alert('Please enter your GitHub username or profile URL first!');
      return;
    }
    setSyncingGithub(true);
    setSyncMsg('');
    try {
      const res = await getLiveGitHubData(target);
      if (res?.success) {
        const updated = {
          ...profile,
          githubUrl: res.githubUrl || profile.githubUrl,
          githubStats: res.githubStats,
          repositories: res.repositories || [],
        };
        setProfile(updated);
        setSyncMsg(`Synced ${res.repositories?.length || 0} repositories and ${res.githubStats?.totalStars || 0} ⭐ stars from GitHub!`);
        setTimeout(() => setSyncMsg(''), 5000);

        // Auto-persist synced data to backend
        const saveRes = await updateUserProfile(updated);
        if (saveRes?.success && saveRes.user) {
          setProfile((prev) => ({
            ...prev,
            ranking: saveRes.user.ranking,
            rankingPoints: saveRes.user.rankingPoints,
          }));
        }
      } else {
        alert(res?.message || 'Could not fetch GitHub profile. Please verify your username.');
      }
    } catch (err) {
      alert(err.message || 'Error syncing with GitHub');
    } finally {
      setSyncingGithub(false);
    }
  };

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const skillToAdd = (skillSelect === 'custom' ? newSkill : (skillSelect || newSkill)).trim();
    if (!skillToAdd) return;
    if (!profile.skills.includes(skillToAdd)) {
      setProfile({ ...profile, skills: [...profile.skills, skillToAdd] });
    }
    setNewSkill('');
    setSkillSelect('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skillToRemove) });
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    setProfile({
      ...profile,
      projects: [...(profile.projects || []), { ...newProject }],
    });
    setNewProject({ title: '', tech: '', description: '', link: '' });
    setShowAddProject(false);
  };

  const handleRemoveProject = (indexToRemove) => {
    setProfile({
      ...profile,
      projects: profile.projects.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleAddRepo = (e) => {
    e.preventDefault();
    if (!newRepo.name.trim()) return;
    setProfile({
      ...profile,
      repositories: [
        ...(profile.repositories || []),
        { ...newRepo, stars: Number(newRepo.stars) || 0 },
      ],
    });
    setNewRepo({ name: '', language: 'JavaScript', description: '', url: '', stars: 0 });
    setShowAddRepo(false);
  };

  const handleRemoveRepo = (indexToRemove) => {
    setProfile({
      ...profile,
      repositories: profile.repositories.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateUserProfile(profile);
      if (res?.success && res.user) {
        setProfile((prev) => ({
          ...prev,
          name: res.user.name,
          department: res.user.department,
          bio: res.user.bio,
          githubUrl: res.user.githubUrl,
          ranking: res.user.ranking,
          rankingPoints: res.user.rankingPoints,
          projects: res.user.projects || [],
          repositories: res.user.repositories || [],
          githubStats: res.user.githubStats || null,
        }));
        setSaveMsg('Profile updated and saved to database successfully!');
        setTimeout(() => setSaveMsg(''), 4000);
        setIsEditing(false);
      } else {
        alert(res?.message || 'Failed to update profile.');
      }
    } catch {
      alert('Network error while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.name
    ? profile.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  if (loading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading your profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header Banner */}
        <div className="p-6 sm:p-8 rounded-[32px] glass-panel text-white shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 text-amber-300 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">{profile.name || 'Student Profile'}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{profile.ranking}</span>
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1 font-medium">
                {profile.department} Department &bull; {profile.email} &bull;{' '}
                <span className="text-amber-300 font-bold">{profile.rankingPoints} Points</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto relative z-10">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="glass-btn-ghost px-4 py-2.5 rounded-2xl text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="flex-1 sm:flex-none glass-btn-cta px-5 py-2.5 rounded-2xl text-slate-950 text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="glass-btn-cta px-5 py-2.5 rounded-2xl text-slate-950 text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile & Projects
              </button>
            )}
          </div>
        </div>

        {/* User-Controlled Availability Card (Phase 5) */}
        <div className="p-5 rounded-[28px] glass-panel text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-white/20">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${profile.openToWork ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Collaboration & Project Availability</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${profile.openToWork ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {profile.openToWork ? '● Available for Projects' : '○ Busy / In a Project'}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1">
                {profile.openToWork 
                  ? 'You are publicly visible in "Find Peers" and open to receive team invitations and collaboration inquiries.'
                  : 'You are currently marked busy and hidden from new project searches. You can still collaborate on your active teams.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleOpenToWork}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0 ${profile.openToWork ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{profile.openToWork ? 'Switch to Busy' : 'Set as Available'}</span>
          </button>
        </div>

        {saveMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{saveMsg}</span>
          </div>
        )}

        {/* Credentials & Details Card */}
        <div className="p-6 sm:p-8 rounded-[32px] glass-panel shadow-2xl space-y-6">
          <h2 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-300" />
            <span>Personal & Contact Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full p-3 glass-input-field rounded-2xl text-sm font-semibold text-white"
                />
              ) : (
                <p className="text-sm font-bold text-white tracking-wide">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Institute Email
              </label>
              <p className="text-sm font-semibold text-white/90 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-300" /> {profile.email}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Department
              </label>
              {isEditing ? (
                <select
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  className="w-full p-3 glass-input-field rounded-2xl text-sm font-semibold text-white appearance-none cursor-pointer"
                >
                  <option value="BBA" className="bg-slate-900 text-white">BBA</option>
                  <option value="BCA" className="bg-slate-900 text-white">BCA</option>
                  <option value="MBA" className="bg-slate-900 text-white">MBA</option>
                  <option value="MCA" className="bg-slate-900 text-white">MCA</option>
                  <option value="General" className="bg-slate-900 text-white">General</option>
                </select>
              ) : (
                <p className="text-sm font-semibold text-white/90 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-300" /> {profile.department}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
                  GitHub Profile URL
                </label>
                {profile.githubUrl && (
                  <button
                    type="button"
                    onClick={() => handleSyncGitHub()}
                    disabled={syncingGithub}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {syncingGithub ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                    ) : (
                      <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                    )}
                    <span>{syncingGithub ? 'Syncing...' : 'Sync Live'}</span>
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="githubUrl"
                    placeholder="https://github.com/your-username"
                    value={profile.githubUrl}
                    onChange={handleChange}
                    className="flex-1 p-3 glass-input-field rounded-2xl text-sm font-semibold text-white placeholder-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => handleSyncGitHub()}
                    disabled={syncingGithub || !profile.githubUrl?.trim()}
                    className="px-4 py-2 glass-btn-cta text-slate-950 font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {syncingGithub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>Sync</span>
                  </button>
                </div>
              ) : profile.githubUrl ? (
                <div className="flex items-center justify-between">
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1.5"
                  >
                    <GithubIcon className="w-4 h-4 text-white" />
                    <span>{profile.githubUrl.replace('https://', '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => handleSyncGitHub()}
                    disabled={syncingGithub}
                    className="px-2.5 py-1 rounded-xl glass-btn-ghost text-amber-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {syncingGithub ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    <span>Refresh</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-white/50 italic">No GitHub account linked yet.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
              About / Bio
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                name="bio"
                placeholder="Write a brief overview of your technical background, hackathon interests, or collaboration goals..."
                value={profile.bio}
                onChange={handleChange}
                className="w-full p-3 glass-input-field rounded-2xl text-sm font-medium text-white placeholder-white/40 resize-none"
              />
            ) : (
              <p className="text-sm text-white/90 leading-relaxed glass-tile p-4 rounded-2xl">
                {profile.bio || 'No bio added yet. Click "Edit Profile" to tell peers about yourself.'}
              </p>
            )}
          </div>

          {/* Skills Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
              Verified Skills & Tech Stack
            </label>

            {profile.skills.length === 0 ? (
              <p className="text-xs text-white/50 italic">No skills added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3.5 py-1 glass-tile rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-sm"
                  >
                    <Code className="w-3 h-3 text-amber-300" /> {skill}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 text-white/50 hover:text-red-400 font-black cursor-pointer"
                        title="Remove skill"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            {isEditing && (
              <form onSubmit={handleAddSkill} className="space-y-2 pt-2 max-w-md">
                <div className="flex gap-2">
                  <select
                    value={skillSelect}
                    onChange={(e) => {
                      setSkillSelect(e.target.value);
                      if (e.target.value && e.target.value !== 'custom') {
                        setNewSkill(e.target.value);
                      } else if (e.target.value === 'custom') {
                        setNewSkill('');
                      }
                    }}
                    className="flex-1 p-2.5 glass-input-field rounded-xl text-xs text-white appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-white">Select from standard skills...</option>
                    {CURATED_SKILLS.filter((s) => !profile.skills.includes(s)).map((skill) => (
                      <option key={skill} value={skill} className="bg-slate-900 text-white">
                        {skill}
                      </option>
                    ))}
                    <option value="custom" className="bg-slate-900 text-amber-300">+ Other (Type custom skill)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!skillSelect && !newSkill.trim()}
                    className="glass-btn-cta px-4 py-2 text-slate-950 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                {skillSelect === 'custom' && (
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Type custom skill (e.g. Kotlin, Rust, Go)..."
                    className="w-full p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
                    autoFocus
                  />
                )}
              </form>
            )}
          </div>
        </div>

        {/* Showcased Projects Section */}
        <div className="p-6 sm:p-8 rounded-[32px] glass-panel shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-300" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Showcased Projects ({profile.projects?.length || 0})
              </h2>
            </div>
            {isEditing && !showAddProject && (
              <button
                onClick={() => setShowAddProject(true)}
                className="px-3 py-1.5 rounded-xl glass-btn-ghost text-amber-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            )}
          </div>

          {/* Add Project Form (when in editing mode) */}
          {showAddProject && (
            <form onSubmit={handleAddProject} className="p-4 rounded-2xl glass-tile space-y-3 border border-amber-400/30">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Add New Project</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Project Title *"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
                />
                <input
                  type="text"
                  placeholder="Tech Stack (e.g. React, Express, MongoDB)"
                  value={newProject.tech}
                  onChange={(e) => setNewProject({ ...newProject, tech: e.target.value })}
                  className="p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Brief project description and key features..."
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 resize-none font-medium"
              />
              <input
                type="text"
                placeholder="Demo or Code Link (e.g. https://github.com/your-repo)"
                value={newProject.link}
                onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                className="w-full p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newProject.title.trim()}
                  className="glass-btn-cta py-1.5 px-4 rounded-xl text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Add Project to List
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="glass-btn-ghost py-1.5 px-3 rounded-xl text-white/70 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {profile.projects?.length === 0 ? (
            <p className="text-xs text-white/50 italic py-2">
              No showcased projects added yet. Click "Edit Profile & Projects" above to add your apps and hackathon builds.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {profile.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl glass-tile space-y-2 transition-all relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                        >
                          <span>Demo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveProject(idx)}
                          className="p-1 rounded text-white/50 hover:text-red-400 cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-white/70 line-clamp-2">{proj.description}</p>
                  )}
                  {proj.tech && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {proj.tech.split(',').map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] font-bold text-white/80"
                        >
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Public Repositories & Live GitHub Sync Section */}
        <div className="p-6 sm:p-8 rounded-[32px] glass-panel shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-amber-300 shadow-md">
                <FolderGit2 className="w-5 h-5 drop-shadow-[0_1px_4px_rgba(251,191,36,0.5)]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                  <span>Live GitHub Repositories</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-300/40">
                    {profile.repositories?.length || 0}
                  </span>
                </h2>
                <p className="text-xs text-white/70 font-medium">
                  Real-time sync of candidate repositories, languages & open-source stars
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSyncGitHub()}
                disabled={syncingGithub || !profile.githubUrl?.trim()}
                className="glass-btn-cta px-4 py-2.5 rounded-2xl text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {syncingGithub ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                )}
                <span>{syncingGithub ? 'Syncing GitHub...' : '⚡ Sync Live from GitHub'}</span>
              </button>

              {isEditing && !showAddRepo && (
                <button
                  onClick={() => setShowAddRepo(true)}
                  className="glass-btn-ghost px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Custom Repo
                </button>
              )}
            </div>
          </div>

          {syncMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{syncMsg}</span>
            </div>
          )}

          {/* GitHub Live Developer Stats Ribbon */}
          {profile.githubStats && (
            <div className="p-4 rounded-2xl glass-panel-sub space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  {profile.githubStats.avatarUrl && (
                    <img
                      src={profile.githubStats.avatarUrl}
                      alt={profile.githubStats.username}
                      className="w-10 h-10 rounded-xl border border-white/30 object-cover shadow"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">@{profile.githubStats.username}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-300/40">
                        Live Synced
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60">
                      GitHub Developer Card &bull; Last checked{' '}
                      {profile.githubStats.lastSynced ? new Date(profile.githubStats.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-base font-extrabold text-amber-300 flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-amber-300" />
                      <span>{profile.githubStats.totalStars || 0}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50">Stars</span>
                  </div>

                  <div className="text-center">
                    <div className="text-base font-extrabold text-white flex items-center justify-center gap-1">
                      <GitFork className="w-4 h-4 text-white/60" />
                      <span>{profile.githubStats.totalForks || 0}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50">Forks</span>
                  </div>

                  <div className="text-center">
                    <div className="text-base font-extrabold text-amber-300">
                      {profile.githubStats.publicRepos || profile.repositories?.length || 0}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50">Repos</span>
                  </div>

                  <div className="text-center">
                    <div className="text-base font-extrabold text-white">
                      {profile.githubStats.followers || 0}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50">Followers</span>
                  </div>
                </div>
              </div>

              {/* Top Synced Languages */}
              {profile.githubStats.topLanguages && profile.githubStats.topLanguages.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-white/70 mr-1 flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-amber-300" /> Top Languages:
                  </span>
                  {profile.githubStats.topLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-0.5 rounded-lg glass-tile text-[11px] font-bold text-amber-200"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              )}

              {/* GitHub Streak Card Preview */}
              {profile.githubStats.streakUrl && (
                <div className="pt-2">
                  <img
                    src={profile.githubStats.streakUrl}
                    alt="GitHub Streak"
                    className="w-full max-w-md rounded-2xl border border-white/20 shadow-md"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Optional Custom Repository Form (for manual override) */}
          {showAddRepo && (
            <form onSubmit={handleAddRepo} className="p-4 rounded-2xl glass-tile space-y-3 border border-amber-400/30">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Add Custom Repository</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Repository Name *"
                  value={newRepo.name}
                  onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                  className="p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
                />
                <input
                  type="text"
                  placeholder="Language (e.g. TypeScript)"
                  value={newRepo.language}
                  onChange={(e) => setNewRepo({ ...newRepo, language: e.target.value })}
                  className="p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
                />
                <input
                  type="number"
                  placeholder="Stars (⭐ count)"
                  value={newRepo.stars}
                  onChange={(e) => setNewRepo({ ...newRepo, stars: e.target.value })}
                  className="p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
                />
              </div>
              <input
                type="text"
                placeholder="Repository URL (e.g. https://github.com/your-username/repo-name)"
                value={newRepo.url}
                onChange={(e) => setNewRepo({ ...newRepo, url: e.target.value })}
                className="w-full p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 font-medium"
              />
              <textarea
                rows={2}
                placeholder="Repository description..."
                value={newRepo.description}
                onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                className="w-full p-2.5 glass-input-field rounded-xl text-xs text-white placeholder-white/40 resize-none font-medium"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newRepo.name.trim()}
                  className="glass-btn-cta py-1.5 px-4 rounded-xl text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Add Repository
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRepo(false)}
                  className="glass-btn-ghost py-1.5 px-3 rounded-xl text-white/70 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Repositories Cards Grid */}
          {profile.repositories?.length === 0 ? (
            <div className="p-8 rounded-[28px] glass-tile text-center space-y-3">
              <FolderGit2 className="w-10 h-10 text-white/40 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No Repositories Synced Yet</h4>
                <p className="text-xs text-white/70 max-w-md mx-auto">
                  Automatically pull your real repositories, stars, forks, and top programming languages directly using GitHub Sync — 100% free with no password or token required!
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSyncGitHub()}
                disabled={syncingGithub || !profile.githubUrl?.trim()}
                className="glass-btn-cta inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>{profile.githubUrl?.trim() ? '⚡ Sync Repositories Now' : 'Enter GitHub URL Above First'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {profile.repositories.map((repo, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl glass-tile hover:bg-white/[0.12] transition-all flex flex-col justify-between space-y-2.5 group relative"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={repo.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors truncate flex items-center gap-1.5"
                      >
                        <GithubIcon className="w-3.5 h-3.5 text-white/60 group-hover:text-amber-300 shrink-0" />
                        <span className="truncate">{repo.name}</span>
                        <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-amber-300 shrink-0" />
                      </a>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveRepo(idx)}
                          className="p-1 rounded text-white/50 hover:text-red-400 cursor-pointer shrink-0"
                          title="Delete repository"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {repo.description ? (
                      <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">
                        {repo.description}
                      </p>
                    ) : (
                      <p className="text-[11px] text-white/40 italic">No description provided</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/70 pt-2 border-t border-white/10">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-bold text-white/90">
                      {repo.language || 'Code'}
                    </span>
                    <div className="flex items-center gap-3">
                      {repo.forks !== undefined && (
                        <span className="flex items-center gap-1 text-white/70 font-semibold" title="Forks">
                          <GitFork className="w-3 h-3 text-white/50" />
                          <span>{repo.forks || 0}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-amber-300 font-bold" title="Stars">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span>{repo.stars || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Profile;
