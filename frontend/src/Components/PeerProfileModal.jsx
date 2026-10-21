import React from 'react';
import {
  X,
  Award,
  ExternalLink,
  Code,
  FolderGit2,
  Briefcase,
  Star,
  CheckCircle2,
  XCircle,
  Mail,
  GraduationCap,
  Sparkles,
  Send,
  Video,
  Paperclip,
  GitFork,
} from 'lucide-react';

const GithubIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export function PeerProfileModal({
  profile,
  requestContext,
  onClose,
  onAccept,
  onReject,
  onOpenSendRequest,
  onOpenInteraction,
}) {
  if (!profile) return null;

  const initials = profile.name
    ? profile.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  const projects = profile.projects || [];
  const repositories = profile.repositories || [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-2xl p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] glass-panel shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative p-6 sm:p-7 border-b border-white/10 bg-white/[0.04]">
          <div className="absolute top-5 right-5 flex items-center gap-2">
            {onOpenSendRequest && !profile.hasRequested && (
              <button
                onClick={() => onOpenSendRequest(profile)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-btn-cta text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Request Help
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-start gap-4 pr-12">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 text-amber-300 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">
                  {profile.name}
                </h2>
                {profile.ranking && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{profile.ranking}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                  {profile.department}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-amber-300" />
                  {profile.email}
                </span>
              </div>

              {profile.rankingPoints && (
                <div className="text-xs text-white/70 pt-0.5">
                  Coding Rating Points:{' '}
                  <span className="font-extrabold text-amber-300">
                    {profile.rankingPoints} pts
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 text-sm">
          {/* Request Message Note Banner (if opened from a collaboration request) */}
          {requestContext?.message && (
            <div className="p-4 rounded-2xl glass-tile space-y-1 border border-amber-400/30">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Collaboration Note From Candidate</span>
              </div>
              <p className="text-sm italic text-white/90">
                "{requestContext.message}"
              </p>
            </div>
          )}

          {/* Attached Project File / Document */}
          {requestContext?.fileUrl && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl glass-tile text-xs border border-white/20">
              <div className="flex items-center gap-2 text-white/90">
                <Paperclip className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="font-semibold text-white">{requestContext.fileName || 'Shared Project File / Document'}</span>
              </div>
              <a
                href={requestContext.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-3 glass-btn-ghost text-amber-300 font-bold rounded-lg flex items-center gap-1 transition-all"
              >
                <span>Open File</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Bio / Summary */}
          {profile.bio && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/60">
                About Candidate
              </h3>
              <p className="text-white/90 leading-relaxed glass-tile p-3.5 rounded-2xl">
                {profile.bio}
              </p>
            </div>
          )}

          {/* GitHub Developer Card & Live Sync Stats */}
          <div className="p-4 rounded-2xl glass-panel-sub space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {profile.githubStats?.avatarUrl ? (
                  <img
                    src={profile.githubStats.avatarUrl}
                    alt={profile.githubStats.username}
                    className="w-10 h-10 rounded-xl border border-white/30 object-cover"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                      GitHub Profile
                    </p>
                    {profile.githubStats && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-300/40">
                        Live Synced
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {profile.githubStats?.username
                      ? `@${profile.githubStats.username}`
                      : profile.githubUrl
                      ? profile.githubUrl.replace('https://github.com/', '').replace(/\/$/, '')
                      : 'Not linked'}
                  </p>
                </div>
              </div>
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn-cta px-3 py-1.5 rounded-xl text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer shrink-0"
                >
                  <span>View GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* If Synced GitHub Stats Available */}
            {profile.githubStats && (
              <>
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center">
                  <div className="p-2 rounded-xl glass-tile">
                    <div className="text-sm font-extrabold text-amber-300 flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      <span>{profile.githubStats.totalStars || 0}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50">Stars</span>
                  </div>

                  <div className="p-2 rounded-xl glass-tile">
                    <div className="text-sm font-extrabold text-white flex items-center justify-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-white/60" />
                      <span>{profile.githubStats.totalForks || 0}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50">Forks</span>
                  </div>

                  <div className="p-2 rounded-xl glass-tile">
                    <div className="text-sm font-extrabold text-amber-300">
                      {profile.githubStats.publicRepos || repositories.length}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50">Repos</span>
                  </div>

                  <div className="p-2 rounded-xl glass-tile">
                    <div className="text-sm font-extrabold text-white">
                      {profile.githubStats.followers || 0}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50">Followers</span>
                  </div>
                </div>

                {profile.githubStats.topLanguages && profile.githubStats.topLanguages.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-white/60 mr-1 flex items-center gap-1">
                      <Code className="w-3 h-3 text-amber-300" /> Languages:
                    </span>
                    {profile.githubStats.topLanguages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 rounded-md glass-tile text-[10px] font-bold text-amber-200"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}

                {profile.githubStats.streakUrl && (
                  <div className="pt-1">
                    <img
                      src={profile.githubStats.streakUrl}
                      alt="GitHub Activity Streak"
                      loading="lazy"
                      className="w-full rounded-2xl border border-white/20 shadow-md"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-amber-300" />
                <span>Verified Skills & Stack</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 glass-tile rounded-xl text-xs font-semibold text-white/90"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-300" />
              <span>Showcased Projects ({projects.length})</span>
            </h3>

            {projects.length === 0 ? (
              <p className="text-xs text-white/50 italic">
                No public projects showcased yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl glass-tile space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-sm">
                        {proj.title}
                      </h4>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 shrink-0"
                        >
                          <span>Code / Demo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-xs text-white/70 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                    {proj.tech && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {proj.tech.split(',').map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-bold text-white/80"
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

          {/* Repositories Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Public Repositories ({repositories.length})</span>
            </h3>

            {repositories.length === 0 ? (
              <p className="text-xs text-white/50 italic">
                No repositories linked yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {repositories.map((repo, idx) => (
                  <a
                    key={idx}
                    href={repo.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl glass-tile hover:bg-white/[0.12] transition-all block space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors truncate flex items-center gap-1.5">
                        <GithubIcon className="w-3.5 h-3.5 text-white/60 group-hover:text-amber-300 shrink-0" />
                        <span className="truncate">{repo.name}</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-amber-300 shrink-0" />
                    </div>
                    {repo.description && (
                      <p className="text-[11px] text-white/70 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-white/70 pt-1">
                      <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-semibold text-white/90">
                        {repo.language || 'Code'}
                      </span>
                      <div className="flex items-center gap-2.5">
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
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-black/30 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-white/60 font-medium">
            CampusCollab Verified Candidate Profile
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {requestContext?.status === 'pending' && onAccept && onReject ? (
              <>
                {onOpenInteraction && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenInteraction(requestContext);
                    }}
                    className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl glass-btn-cta text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" /> Schedule Sync / Call
                  </button>
                )}
                <button
                  onClick={() => {
                    onAccept(requestContext.id);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {requestContext.team ? 'Accept & Join Team' : 'Accept Connection'}
                </button>
                <button
                  onClick={() => {
                    onReject(requestContext.id);
                    onClose();
                  }}
                  className="glass-btn-ghost flex-1 sm:flex-none py-2 px-4 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-white/60" /> Reject
                </button>
              </>
            ) : onOpenSendRequest ? (
              <>
                {profile.hasRequested ? (
                  <button
                    disabled
                    className="flex-1 sm:flex-none py-2 px-4 rounded-xl glass-tile text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Request Already Sent
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onOpenSendRequest(profile);
                    }}
                    className="glass-btn-cta flex-1 sm:flex-none py-2 px-5 rounded-xl text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Request for Help / Project
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="glass-btn-ghost py-2 px-4 rounded-xl text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="glass-btn-ghost w-full sm:w-auto py-2 px-5 rounded-xl text-white font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PeerProfileModal;
