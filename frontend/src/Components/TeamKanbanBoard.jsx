import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  User,
  Calendar,
  Filter,
  ExternalLink,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  FolderGit2,
  MessageSquare,
  Lock
} from 'lucide-react';
import { addTeamTask, updateTeamTask, deleteTeamTask } from '../API/teams';
import TeamChatBox from './TeamChatBox';

export function TeamKanbanBoard({ team, currentUser, onClose, onTeamUpdated, initialView = 'kanban' }) {
  const currentUserId = currentUser?._id ? currentUser._id.toString() : '';
  const isMemberOrLead = Boolean(
    team?.isMember ||
    team?.isLead ||
    (currentUserId && (
      (team?.lead?._id || team?.lead)?.toString() === currentUserId ||
      (team?.members || []).some((m) => (m?._id || m)?.toString() === currentUserId)
    ))
  );

  const [activeView, setActiveView] = useState(
    initialView === 'chat' && !isMemberOrLead ? 'kanban' : initialView
  ); // 'kanban' | 'chat'

  useEffect(() => {
    if (initialView) {
      if (initialView === 'chat' && !isMemberOrLead) {
        setActiveView('kanban');
      } else {
        setActiveView(initialView);
      }
    }
  }, [initialView, isMemberOrLead]);

  const [tasks, setTasks] = useState(team?.tasks || []);

  useEffect(() => {
    if (team?.tasks) {
      setTasks(team.tasks);
    }
  }, [team?.tasks]);

  const [loading, setLoading] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState('ALL'); // 'ALL' | 'ME' | memberId
  const [filterPriority, setFilterPriority] = useState('ALL'); // 'ALL' | 'high' | 'medium' | 'low'
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: currentUser?._id || '',
    dueDate: '',
  });

  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-sky-400',
      badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-sky-400',
      icon: Clock,
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      icon: Layers,
    },
    {
      id: 'review',
      title: 'In Review',
      color: 'border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
      icon: AlertCircle,
    },
    {
      id: 'done',
      title: 'Completed',
      color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
    },
  ];

  // Safely deduplicate lead and team members by unique ID string
  const allMembers = useMemo(() => {
    const memberMap = new Map();
    if (team?.lead) {
      const leadId = (team.lead?._id || team.lead)?.toString();
      if (leadId) {
        memberMap.set(leadId, typeof team.lead === 'object' ? team.lead : { _id: leadId, name: 'Lead' });
      }
    }
    (team?.members || []).forEach((m) => {
      if (m) {
        const mId = (m?._id || m)?.toString();
        if (mId && !memberMap.has(mId)) {
          memberMap.set(mId, typeof m === 'object' ? m : { _id: mId, name: 'Member' });
        }
      }
    });
    return Array.from(memberMap.values());
  }, [team]);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee === 'ME') {
      const assignedId = t.assignedTo?._id || t.assignedTo;
      if (assignedId !== currentUser?._id) return false;
    } else if (filterAssignee !== 'ALL') {
      const assignedId = t.assignedTo?._id || t.assignedTo;
      if (assignedId !== filterAssignee) return false;
    }

    if (filterPriority !== 'ALL' && t.priority !== filterPriority) {
      return false;
    }

    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setLoading(true);
    try {
      const res = await addTeamTask(team._id, newTask);
      if (res?.success) {
        setTasks(res.tasks || []);
        setShowAddModal(false);
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          assignedTo: currentUser?._id || '',
          dueDate: '',
        });
        setActionMsg('Task created and added to Kanban board!');
        setTimeout(() => setActionMsg(''), 4000);
        if (onTeamUpdated) onTeamUpdated(res.team);
      } else {
        alert(res?.message || 'Failed to add task.');
      }
    } catch {
      alert('Error creating task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await updateTeamTask(team._id, taskId, { status: newStatus });
      if (res?.success) {
        setTasks(res.tasks || []);
        if (onTeamUpdated) onTeamUpdated(res.team);
      }
    } catch {
      alert('Failed to update task status.');
    }
  };

  const handleDeleteTask = async (taskId, title) => {
    if (!window.confirm(`Are you sure you want to remove task "${title}"?`)) return;

    // Optimistic UI update
    setTasks((prev) => prev.filter((t) => t._id !== taskId));

    try {
      const res = await deleteTeamTask(team._id, taskId);
      if (res?.success) {
        setTasks(res.tasks || []);
        if (onTeamUpdated) onTeamUpdated(res.team);
      }
    } catch {
      alert('Failed to delete task.');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const getNextStatus = (current) => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'review';
    if (current === 'review') return 'done';
    return null;
  };

  const getPrevStatus = (current) => {
    if (current === 'done') return 'review';
    if (current === 'review') return 'in_progress';
    if (current === 'in_progress') return 'todo';
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Breadcrumb & Header Bar */}
      <div className="glass-panel p-6 sm:p-7 rounded-[32px] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <button
                onClick={onClose}
                className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer font-bold"
              >
                <span>Teams Workspace</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-blue-600 dark:text-sky-400 font-extrabold truncate max-w-xs">
                {team.title}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/25">
                Kanban War Room
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>{team.title}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              {team.description || 'Collaborative engineering board for tasks, features, sprint progress, and code milestones.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View switcher: Kanban vs Chat */}
            <div className="glass-tile p-1 rounded-2xl flex items-center gap-1 border border-white/60 dark:border-white/10">
              <button
                onClick={() => setActiveView('kanban')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'kanban'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tasks ({tasks.length})</span>
              </button>

              {isMemberOrLead ? (
                <button
                  onClick={() => setActiveView('chat')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'chat'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Live Chat</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActionMsg(
                      team.hasRequested
                        ? 'Join request pending approval. Team chat unlocks once accepted!'
                        : 'Team chat & files are private to active members. Request to join this squad to unlock live discussions!'
                    );
                    setTimeout(() => setActionMsg(''), 6000);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 dark:text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer group"
                  title="Members only — Live chat is locked for non-members"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
                  <span>Live Chat</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/5 text-amber-300/80 font-bold border border-white/10">
                    Locked
                  </span>
                </button>
              )}
            </div>

            {isMemberOrLead && (
              <Link
                to={`/chat?teamId=${team._id || team.id}`}
                className="px-3 py-1.5 rounded-xl glass-tile text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-500/20"
                title="Open Dedicated Fullscreen Chat Page"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chat Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}

            {team.githubUrl && (
              <a
                href={team.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-2xl glass-btn-ghost text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span className="hidden sm:inline">GitHub</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {activeView === 'kanban' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-2xl glass-btn-cta text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Task</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-2xl glass-tile text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Return to Teams List"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Sprint Progress Bar & Metrics (Only in Tasks View) */}
        {activeView === 'kanban' && (
          <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    <span>Sprint Completion</span>
                  </span>
                  <span className="text-blue-600 dark:text-sky-400 font-black">
                    {completedTasks} of {totalTasks} tasks completed ({progressPercent}%)
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-500 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-tile">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{allMembers.length} Active Collaborators</span>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  Assignee:
                </span>

                <button
                  onClick={() => setFilterAssignee('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filterAssignee === 'ALL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'glass-tile text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All Members
                </button>

                <button
                  onClick={() => setFilterAssignee('ME')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filterAssignee === 'ME'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'glass-tile text-slate-600 dark:text-slate-300'
                  }`}
                >
                  My Tasks
                </button>

                {allMembers.map((m) => (
                  <button
                    key={m._id}
                    onClick={() => setFilterAssignee(m._id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      filterAssignee === m._id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'glass-tile text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m.name ? m.name.split(' ')[0] : 'Member'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-600 dark:text-slate-400">Priority:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-2.5 py-1 rounded-xl glass-tile text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {actionMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}
      </div>

      {/* Main Content Area: Chat Box vs 4 Kanban Columns */}
      {activeView === 'chat' && isMemberOrLead ? (
        <TeamChatBox team={team} currentUser={currentUser} />
      ) : activeView === 'chat' && !isMemberOrLead ? (
        <div className="glass-card p-10 rounded-3xl text-center max-w-lg mx-auto my-12 border border-white/10 space-y-4 animate-fade-in shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Team Chat is Private
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Live messaging, code sharing, and project attachments are strictly reserved for official team members and leads.
          </p>
          <button
            onClick={() => setActiveView('kanban')}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            &larr; View Kanban Task Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {columns.map((col) => {
          const ColIcon = col.icon;
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="rounded-[28px] glass-panel p-4 sm:p-5 flex flex-col min-h-[500px] space-y-4"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xl ${col.color}`}>
                    <ColIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {col.title}
                  </h3>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${col.badgeBg}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold border-2 border-dashed border-slate-200/50 dark:border-white/5 rounded-2xl">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const prevStatus = getPrevStatus(task.status);
                    const nextStatus = getNextStatus(task.status);

                    return (
                      <div
                        key={task._id}
                        className="glass-tile p-4 rounded-2xl space-y-3 shadow-md hover:shadow-lg transition-all group relative border border-white/80 dark:border-white/10"
                      >
                        {/* Task Priority & Actions */}
                        <div className="flex items-center justify-between gap-2">
                          {getPriorityBadge(task.priority)}

                          <button
                            onClick={() => handleDeleteTask(task._id, task.title)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Task Title & Details */}
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Assignee & Due Date Footer */}
                        <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold text-[9px] shrink-0">
                              {task.assignedTo?.name ? task.assignedTo.name[0] : <User className="w-3 h-3" />}
                            </div>
                            <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                              {task.assignedTo?.name ? task.assignedTo.name.split(' ')[0] : 'Unassigned'}
                            </span>
                          </div>

                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                              <Calendar className="w-3 h-3" />
                              <span>{task.dueDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Advancement Arrows */}
                        <div className="pt-2 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-between gap-1 text-xs">
                          {prevStatus ? (
                            <button
                              onClick={() => handleStatusChange(task._id, prevStatus)}
                              className="px-2 py-1 rounded-xl glass-tile text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 flex items-center gap-1 transition-all cursor-pointer"
                              title="Move back"
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span>Back</span>
                            </button>
                          ) : (
                            <div />
                          )}

                          {nextStatus && (
                            <button
                              onClick={() => handleStatusChange(task._id, nextStatus)}
                              className="px-2.5 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-sky-400 dark:hover:text-slate-950 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ml-auto"
                              title="Advance status"
                            >
                              <span>Advance</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Add Button at bottom of column */}
              <button
                onClick={() => {
                  setNewTask((prev) => ({ ...prev, status: col.id }));
                  setShowAddModal(true);
                }}
                className="w-full py-2 rounded-2xl border border-dashed border-slate-300/80 dark:border-white/10 hover:border-blue-500/40 text-slate-500 hover:text-blue-600 dark:hover:text-sky-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task to {col.title}</span>
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* CREATE NEW TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-2xl sm:rounded-[32px] space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/25">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Create New Task
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add a deliverable to {team.title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl glass-tile text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement JWT Authentication with cookies"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 glass-input-field rounded-2xl text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description & Acceptance Criteria
                </label>
                <textarea
                  rows={3}
                  placeholder="Details, API endpoints, or links to Figma design..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 glass-input-field rounded-2xl text-xs sm:text-sm font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    className="w-full px-3.5 py-2.5 glass-input-field rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {allMembers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.department || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 glass-input-field rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Due Date / Milestone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next Monday / Oct 25 / Sprint 1"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 glass-input-field rounded-2xl text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl glass-btn-ghost text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || !newTask.title.trim()}
                  className="px-5 py-2.5 rounded-2xl glass-btn-cta text-white font-black shadow-lg shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeamKanbanBoard;
