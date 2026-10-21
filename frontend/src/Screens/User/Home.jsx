import React, { useState, useEffect } from 'react';
import Layout from '../../Components/Layout';
import {
  Users,
  Send,
  CheckCircle2,
  Zap,
  Handshake,
  Trophy,
  ArrowRight,
  Sparkles,
  Loader2,
  ShieldCheck,
  Video,
  Calendar,
  CalendarDays,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMe } from '../../API/auth';
import { getPeers, getMyRequests } from '../../API/peers';

// Helper: Calculate live countdown for scheduled meetings
const getMeetingCountdown = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  try {
    const meetingTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(meetingTime.getTime())) return null;
    const diffMs = meetingTime.getTime() - Date.now();
    if (diffMs < -3600000) {
      return { status: 'past', text: 'Meeting completed' };
    }
    if (diffMs <= 0 && diffMs >= -3600000) {
      return { status: 'live', text: 'Meeting is LIVE NOW!' };
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return { status: 'upcoming', text: `Starts in ${days} day${days > 1 ? 's' : ''}` };
    }
    if (diffHours > 0) {
      return { status: 'upcoming', text: `Starts in ${diffHours}h ${diffMinutes}m` };
    }
    return { status: 'imminent', text: `Starts in ${diffMinutes} mins` };
  } catch {
    return null;
  }
};

// Helper: Generate Google Calendar 1-Click link
const getCalendarUrl = (req) => {
  if (req.calendarLink) return req.calendarLink;
  if (!req.scheduledDate || !req.scheduledTime) return null;
  try {
    const dateFormatted = req.scheduledDate.replace(/-/g, '');
    const timeFormatted = req.scheduledTime.replace(/:/g, '') + '00';
    const startStr = `${dateFormatted}T${timeFormatted}`;
    const dur = parseInt(req.duration || '30', 10);
    const startDate = new Date(`${req.scheduledDate}T${req.scheduledTime}`);
    const endDate = new Date(startDate.getTime() + dur * 60000);
    const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(`CampusCollab Sync: ${req.name || 'Peer Discussion'}`);
    const details = encodeURIComponent(`Scheduled video call for project collaboration.\nVideo Call Link: ${req.meetingLink || ''}\nDuration: ${dur} mins`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${encodeURIComponent(req.meetingLink || '')}`;
  } catch {
    return null;
  }
};

export function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [peers, setPeers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [meRes, peersRes, reqRes] = await Promise.all([
          getMe(),
          getPeers(),
          getMyRequests(),
        ]);

        if (meRes?.success && meRes.user) {
          setCurrentUser(meRes.user);
        }
        if (peersRes?.success) {
          setPeers(peersRes.peers.slice(0, 3));
        }
        if (reqRes?.success) {
          const pending = (reqRes.incoming || []).filter((r) => r.status === 'pending').length;
          const accepted = [
            ...(reqRes.incoming || []).filter((r) => r.status === 'accepted'),
            ...(reqRes.sent || []).filter((r) => r.status === 'accepted'),
          ].length;
          setPendingCount(pending);
          setAcceptedCount(accepted);

          // Extract all scheduled meetings from both incoming and sent
          const allReqs = [...(reqRes.incoming || []), ...(reqRes.sent || [])];
          const scheduled = allReqs.filter((r) => r.scheduledDate && r.scheduledTime);
          setUpcomingMeetings(scheduled);
        }
      } catch (err) {
        console.error('Failed to load home dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const stats = [
    {
      id: 'pending',
      label: 'Pending Requests',
      value: pendingCount,
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
    },
    {
      id: 'active',
      label: 'Active Collaborations',
      value: acceptedCount,
      icon: Handshake,
      color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
    },
    {
      id: 'peers',
      label: 'Open-to-Work Peers',
      value: peers.length,
      icon: Trophy,
      color: 'text-orange-400 bg-orange-500/10 border border-orange-500/20',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Hero Banner */}
        <div className="p-6 sm:p-8 rounded-[32px] glass-panel text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 text-amber-300 text-xs font-bold mb-3 shadow-sm">
              {currentUser?.role === 'admin' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 drop-shadow-[0_1px_4px_rgba(251,191,36,0.6)]" />
                  Administrator Portal
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 drop-shadow-[0_1px_4px_rgba(251,191,36,0.6)]" />
                  Candidate Portal
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''}!
            </h1>

            <p className="text-sm text-white/70 mt-1 font-medium">
              {currentUser?.role === 'admin'
                ? 'Institute Administrator • Platform Management & Student Oversight'
                : `${currentUser?.department || 'Institute Student'} • Ready to find partners and collaborate`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 relative z-10">
            {currentUser?.role === 'admin' ? (
              <Link
                to="/admin"
                className="glass-btn-cta px-5 py-2.5 rounded-2xl text-slate-950 text-sm font-black shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                Go to Admin Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/search"
                  className="glass-btn-cta px-5 py-2.5 rounded-2xl text-slate-950 text-sm font-black shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Users className="w-4 h-4" />
                  Find Peers
                </Link>

                <Link
                  to="/requests"
                  className="glass-btn-ghost px-5 py-2.5 rounded-2xl text-white text-sm font-bold transition-all cursor-pointer"
                >
                  View Requests ({pendingCount})
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Quick Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="p-5 rounded-[26px] glass-panel-sub shadow-xl flex items-center gap-4 transition-all hover:bg-white/[0.12]"
              >
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/25 text-amber-300 shadow-md">
                  <Icon className="w-6 h-6 drop-shadow-[0_1px_6px_rgba(251,191,36,0.5)]" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">
                    {stat.value}
                  </h3>

                  <p className="text-xs font-semibold text-white/70">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming Scheduled Sync / Video Meetings Card (Phase 3) */}
        {currentUser?.role !== 'admin' && upcomingMeetings.length > 0 && (
          <div className="p-6 sm:p-7 rounded-[32px] glass-panel shadow-2xl space-y-4 border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                  <Video className="w-3.5 h-3.5" />
                  <span>Scheduled Video Syncs ({upcomingMeetings.length})</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Upcoming Collaboration Sessions
                </h2>
                <p className="text-xs text-white/70">
                  Pre-scheduled sync meetings with peers to discuss code, projects, and team roles with live countdowns.
                </p>
              </div>

              <Link
                to="/requests"
                className="self-start sm:self-auto glass-btn-ghost px-4 py-2 rounded-xl text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-amber-400/30"
              >
                <span>Manage in Requests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {upcomingMeetings.map((mtg, idx) => {
                const countdown = getMeetingCountdown(mtg.scheduledDate, mtg.scheduledTime);
                const calUrl = getCalendarUrl(mtg);
                return (
                  <div
                    key={mtg.id || idx}
                    className="p-4 rounded-2xl glass-tile border border-white/15 space-y-3 hover:border-amber-400/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm truncate">{mtg.name}</h4>
                          <span className="text-[10px] text-white/60">({mtg.department || 'Student'})</span>
                        </div>
                        {mtg.role && (
                          <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                            Target Role: <strong>{mtg.role}</strong>
                          </div>
                        )}
                      </div>

                      {countdown && (
                        countdown.status === 'live' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black text-[10px] animate-pulse shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            {countdown.text}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold text-[10px] shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-300" />
                            {countdown.text}
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80 font-medium pt-1 border-t border-white/10">
                      <span className="flex items-center gap-1 text-white font-bold">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {mtg.scheduledDate} at {mtg.scheduledTime}
                      </span>
                      <span className="text-white/60">
                        ({mtg.duration || 30} mins &bull; {mtg.timezone || 'IST'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {mtg.meetingLink && (
                        <a
                          href={mtg.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-btn-cta flex-1 py-2 px-3 rounded-xl text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Video Call</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {calUrl && (
                        <a
                          href={calUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-btn-ghost py-2 px-3 rounded-xl text-amber-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-amber-400/30"
                          title="Add to Google Calendar"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Add to Calendar</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured Peers Section for Students / Admin Overview for Admins */}
        {currentUser?.role === 'admin' ? (
          <div className="p-6 sm:p-8 rounded-[32px] glass-panel shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Controls
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Administrator Management Hub
                </h2>
                <p className="text-xs text-white/70 mt-1">
                  You are logged in with administrator privileges. Candidate requests and peer discovery are student-only features.
                </p>
              </div>

              <Link
                to="/admin"
                className="self-start sm:self-auto glass-btn-cta px-4 py-2.5 rounded-xl text-slate-950 text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Full Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <Link
                to="/admin/candidates"
                className="p-4 rounded-2xl glass-tile hover:bg-white/[0.12] transition-all text-center group"
              >
                <div className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">Students</div>
                <div className="text-xs text-white/60 mt-1">Manage Candidates</div>
              </Link>

              <Link
                to="/admin/requests"
                className="p-4 rounded-2xl glass-tile hover:bg-white/[0.12] transition-all text-center group"
              >
                <div className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">Requests</div>
                <div className="text-xs text-white/60 mt-1">Monitor & Delete</div>
              </Link>

              <Link
                to="/admin/teams"
                className="p-4 rounded-2xl glass-tile hover:bg-white/[0.12] transition-all text-center group"
              >
                <div className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">Teams</div>
                <div className="text-xs text-white/60 mt-1">Project Groups</div>
              </Link>

              <Link
                to="/admin/queries"
                className="p-4 rounded-2xl glass-tile hover:bg-white/[0.12] transition-all text-center group"
              >
                <div className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">Inquiries</div>
                <div className="text-xs text-white/60 mt-1">Contact Support</div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-[32px] glass-panel shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Featured Peer Candidates
                </h2>

                <p className="text-xs text-white/70">
                  Live open-to-work students looking for project partners
                </p>
              </div>

              <Link
                to="/search"
                className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : peers.length === 0 ? (
              <div className="text-center py-8 text-white/60 text-sm font-medium">
                No peer candidates available at the moment. As other students sign up, they will appear here!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {peers.map((peer) => (
                  <div
                    key={peer.id}
                    className="p-5 rounded-2xl glass-tile flex flex-col justify-between space-y-4 hover:border-white/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-base">
                          {peer.name}
                        </h3>

                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-200 border border-amber-300/30">
                          {peer.department}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {peer.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-0.5 text-xs bg-white/10 border border-white/20 rounded-lg font-medium text-white/90"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {peer.available}
                      </span>

                      <Link
                        to="/search"
                        className="glass-btn-cta px-3 py-1.5 rounded-xl text-slate-950 text-xs font-black transition-all flex items-center gap-1 shadow-md"
                      >
                        <Send className="w-3 h-3" />
                        Request
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Home;
