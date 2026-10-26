import React, { useState, useEffect } from 'react';
import Layout from '../../Components/Layout';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Inbox,
  ArrowUpRight,
  Loader2,
  User,
  Award,
  FolderGit2,
  Video,
  Mail,
  ExternalLink,
  Sparkles,
  X,
  Paperclip,
  FileText,
  Users,
  Trash2,
  Calendar,
  CalendarDays,
  Timer,
  Code,
  ShieldAlert,
  Terminal,
  FileCode,
  Maximize2,
  Play,
  RotateCw,
  Lock,
  Check,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyRequests, updateRequestStatus, requestPeerInteraction, deleteRequest, assignTechnicalTest, reviewTechnicalTest, getAssessmentQuestions, aiEvaluateAssessment, markInteractionCompleted, allowCandidateToJoin, aiGenerateTestCases } from '../../API/peers';
import { getMe } from '../../API/auth';
import PeerProfileModal from '../../Components/PeerProfileModal';

// Helper: Calculate live countdown / status for a scheduled meeting
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

const FALLBACK_LANG_PRESETS = {
  c: {
    title: 'C (GCC) Algorithmic Screening',
    duration: 20,
    desc: `Problem Statement:\nImplement the required function or algorithm in C (GCC).\n\nRequirements:\n1. Use standard C11 library functions (stdio.h, string.h, stdlib.h).\n2. Use pointer manipulation for in-place modifications where applicable.\n\nSample Test Cases:\nInput: Standard input / parameters\nExpected Output: Correct stdout printed via printf()`,
    starter: `#include <stdio.h>\n#include <string.h>\n\n// Function implementation in C\nvoid solution() {\n    printf("C Test Solution Output\\n");\n}\n\nint main() {\n    solution();\n    return 0;\n}\n`,
  },
  cpp: {
    title: 'C++ Algorithmic Screening',
    duration: 20,
    desc: `Problem Statement:\nImplement the required algorithm in C++.\n\nSample Test Cases:\nInput: Standard input / parameters\nExpected Output: Output printed via std::cout`,
    starter: `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    // Write your C++ solution here\n    cout << "C++ Test Solution Output" << endl;\n    return 0;\n}\n`,
  },
  python: {
    title: 'Python Algorithmic Screening',
    duration: 25,
    desc: `Problem Statement:\nImplement the required algorithm or data processing function in Python 3.\n\nSample Test Cases:\nInput: Function parameters or input()\nExpected Output: Returned value or print() output`,
    starter: `def solution():\n    # Write your Python solution here\n    print("Python Test Solution Output")\n\nif __name__ == "__main__":\n    solution()\n`,
  },
  javascript: {
    title: 'JavaScript Algorithm Screening',
    duration: 30,
    desc: `Problem Statement:\nImplement the required JavaScript function.\n\nSample Test Cases:\nInput: Function arguments\nExpected Output: Return value or console.log()`,
    starter: `function solution() {\n  // Write your code here\n  return "JavaScript Output";\n}\n\nconsole.log(solution());\n`,
  },
};

const VideoSyncRow = ({ req, onOpenInteraction }) => {
  if (req.scheduledDate && req.scheduledTime) {
    const cd = getMeetingCountdown(req.scheduledDate, req.scheduledTime);
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">
                {req.scheduledDate} at {req.scheduledTime}
              </span>
              <span className="text-[11px] text-white/60">
                ({req.duration || 30}m &bull; {req.timezone || 'IST'})
              </span>
              {cd && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  cd.status === 'live' ? 'bg-emerald-500/25 text-emerald-300 animate-pulse' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  {cd.text}
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/50">Scheduled Video Call</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {req.meetingLink && (
            <a
              href={req.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Video className="w-3.5 h-3.5" /> Join Room
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {req.interactionCompleted ? (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Call Verified
            </span>
          ) : onMarkSyncCompleted ? (
            <button
              type="button"
              onClick={() => onMarkSyncCompleted(req.id)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Confirm video sync call has been held to satisfy verification"
            >
              <Check className="w-3.5 h-3.5" /> Mark Call Verified
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onOpenInteraction(req)}
            className="px-2.5 py-1.5 rounded-xl text-white/60 hover:text-white font-medium text-xs transition-all cursor-pointer"
          >
            Reschedule
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 p-2.5 px-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-400/30 transition-all">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
          <Video className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/90 truncate">Video Sync</p>
          <p className="text-[11px] text-white/50 truncate">Optional: Meet with {req.name} to discuss before deciding</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpenInteraction(req)}
        className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-amber-300 border border-amber-400/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Schedule Sync</span>
      </button>
    </div>
  );
};

const AssessmentRow = ({ req, currentUserId, tab, onOpenAssign, onOpenReview }) => {
  const isAssigned = Boolean(req.testDetails?.isAssigned);
  let isEvaluator = false;
  let isCandidate = false;

  if (isAssigned) {
    if (req.testDetails?.assignedBy) {
      isEvaluator = String(req.testDetails.assignedBy) === String(currentUserId);
      isCandidate = !isEvaluator;
    } else if (req.testDetails?.candidate) {
      isCandidate = String(req.testDetails.candidate) === String(currentUserId);
      isEvaluator = !isCandidate;
    } else {
      isEvaluator = tab === 'incoming' ? req.requestType === 'team_join_request' : req.requestType !== 'team_join_request';
      isCandidate = !isEvaluator;
    }
  } else {
    // Before assignment:
    // In incoming tab (recipient): only team_join_request recipient is the evaluator/assigner
    // In sent tab (sender): team_invite and peer sender is the evaluator/assigner
    isEvaluator = tab === 'incoming' ? req.requestType === 'team_join_request' : req.requestType !== 'team_join_request';
    isCandidate = !isEvaluator;
  }

  if (isEvaluator) {
    return req.testDetails?.isAssigned ? (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/25">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white truncate">{req.testDetails.title}</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] uppercase font-bold">
                {req.testDetails.language}
              </span>
              <span className="text-[11px] text-white/50">{req.testDetails.timeLimitMinutes}m limit</span>
              {req.testDetails.violationsCount > 0 && (
                <span className="text-red-400 font-bold text-[11px]">&bull; {req.testDetails.violationsCount} violations</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {req.testDetails.status === 'completed' && (
                <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Submitted & Ready for Review
                </span>
              )}
              {req.testDetails.status === 'terminated_violations' && (
                <span className="text-red-400 text-[11px] font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Terminated (Violations Policy)
                </span>
              )}
              {req.testDetails.status === 'in_progress' && (
                <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> In Progress by Candidate
                </span>
              )}
              {req.testDetails.status === 'pending' && (
                <span className="text-white/50 text-[11px]">Pending Candidate Start</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(req.testDetails.status === 'completed' || req.testDetails.status === 'terminated_violations') && (
            <button
              type="button"
              onClick={() => onOpenReview(req)}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" /> Review Code
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenAssign(req)}
            className="px-2.5 py-1.5 rounded-xl text-white/60 hover:text-white font-medium text-xs transition-all cursor-pointer"
          >
            Edit Test
          </button>
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-between gap-3 p-2.5 px-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
            <Code className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate">Coding Assessment</p>
            <p className="text-[11px] text-white/50 truncate">Optional: Screen {req.name} in a fullscreen VS Code environment</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenAssign(req)}
          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-orange-400 border border-orange-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Code className="w-3.5 h-3.5" />
          <span>Assign Test</span>
        </button>
      </div>
    );
  }

  if (isCandidate) {
    return req.testDetails?.isAssigned ? (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white truncate">{req.testDetails.title}</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] uppercase font-bold">
                {req.testDetails.language}
              </span>
              <span className="text-[11px] text-white/50">{req.testDetails.timeLimitMinutes} mins</span>
            </div>
            <p className="text-[11px] text-white/60">Assigned by {req.name || 'Peer Evaluator'} &bull; Proctored VS Code</p>
          </div>
        </div>
        <div className="shrink-0">
          {req.testDetails.status === 'pending' || req.testDetails.status === 'in_progress' ? (
            <button
              type="button"
              onClick={() => window.open(`/test/${req.id}`, '_blank')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{req.testDetails.status === 'in_progress' ? 'Resume Test' : 'Launch Test'}</span>
            </button>
          ) : req.testDetails.status === 'completed' ? (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Submitted
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Terminated (Violations)
            </span>
          )}
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-between gap-3 p-2.5 px-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/[0.05] text-white/50 flex items-center justify-center shrink-0">
            <Code className="w-3.5 h-3.5 text-white/60" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/80 truncate">Coding Assessment</p>
            <p className="text-[11px] text-white/50 truncate">
              {tab === 'incoming' 
                ? `Optional assessment not assigned yet by ${req.name || 'evaluator'}. The "Launch Test" button will appear here once assigned.`
                : `Waiting for team lead ${req.name || ''} to review or assign technical test. The "Launch Test" button will appear here once assigned.`}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 text-[11px] font-semibold shrink-0">
          Awaiting Assignment
        </span>
      </div>
    );
  }

  return null;
};

export function Requests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('incoming');
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [interactionTarget, setInteractionTarget] = useState(null);
  const [customNote, setCustomNote] = useState('');
  const [customMeetingLink, setCustomMeetingLink] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('16:00');
  const [duration, setDuration] = useState(30);
  const [timezone, setTimezone] = useState('IST');
  const [sendingInteraction, setSendingInteraction] = useState(false);
  const [interactionError, setInteractionError] = useState('');

  // Technical Assessment States
  const [testTarget, setTestTarget] = useState(null);
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testLanguage, setTestLanguage] = useState('javascript');
  const [testDuration, setTestDuration] = useState(30);
  const [testStarter, setTestStarter] = useState('');
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '', explanation: '' }]);
  const [assigningTest, setAssigningTest] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [isGeneratingTestCases, setIsGeneratingTestCases] = useState(false);
  const [aiGenSuccessMsg, setAiGenSuccessMsg] = useState('');

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewScore, setReviewScore] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [updatingReview, setUpdatingReview] = useState(false);
  const [questionsBank, setQuestionsBank] = useState([]);

  const openAssignTestModal = (req) => {
    setTestTarget(req);
    setAssignError('');
    if (req.testDetails?.isAssigned) {
      setTestTitle(req.testDetails.title || '');
      setTestDesc(req.testDetails.description || '');
      setTestLanguage(req.testDetails.language || 'c');
      setTestDuration(req.testDetails.timeLimitMinutes || 20);
      setTestStarter(req.testDetails.starterCode || '');
      if (req.testDetails.testCases && req.testDetails.testCases.length > 0) {
        setTestCases(req.testDetails.testCases);
      } else {
        setTestCases([{ input: '', expectedOutput: '', explanation: '' }]);
      }
      return;
    }

    // Default to the first DB question if available
    const preset = questionsBank && questionsBank.length > 0 ? questionsBank[0] : null;
    if (preset) {
      setTestTitle(preset.title || preset.name || '');
      setTestDesc(preset.description || '');
      setTestLanguage(preset.language || 'c');
      setTestDuration(preset.duration || 20);
      setTestStarter(preset.starterCode || '');
      if (preset.testCases && preset.testCases.length > 0) {
        setTestCases(preset.testCases);
      } else {
        setTestCases([{ input: '"CampusCollab"', expectedOutput: '"balloCsupmaC"', explanation: 'Reverse string in-place' }]);
      }
    } else {
      setTestLanguage('c');
      setTestTitle('C (GCC): In-Place String Reversal with Pointers');
      setTestDuration(20);
      setTestCases([
        { input: '"CampusCollab"', expectedOutput: '"balloCsupmaC"', explanation: 'Reverse string in-place' },
      ]);
      setTestDesc(
`Problem Statement:
Write a C function void reverseString(char* s) that reverses a null-terminated string in-place using two pointers.
Do not allocate another array. You must modify the input string in-place with O(1) auxiliary memory.

Test Cases:
Input: "CampusCollab"
Expected Output: "balloCsupmaC"`
      );
      setTestStarter(
`#include <stdio.h>
#include <string.h>

void reverseString(char* s) {
    // Write your in-place pointer reversal here
    int left = 0;
    int right = strlen(s) - 1;
    while (left < right) {
        char temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        left++;
        right--;
    }
}

int main() {
    char str[] = "CampusCollab";
    printf("Original: %s\\n", str);
    reverseString(str);
    printf("Reversed: %s\\n", str);
    return 0;
}
`
      );
    }
  };

  const handleApplyPreset = (preset) => {
    if (!preset) return;
    setTestTitle(preset.title || preset.name || '');
    setTestDesc(preset.description || '');
    setTestLanguage(preset.language || 'c');
    setTestDuration(preset.duration || 20);
    setTestStarter(preset.starterCode || '');
    if (preset.testCases && preset.testCases.length > 0) {
      setTestCases(preset.testCases);
    } else {
      setTestCases([{ input: '', expectedOutput: '', explanation: '' }]);
    }
  };

  const handleGenerateAiTestCases = async () => {
    if (!testDesc.trim()) {
      setAssignError('Please provide problem statement/requirements first so Gemini can analyze the challenge specifications.');
      return;
    }
    setIsGeneratingTestCases(true);
    setAssignError('');
    setAiGenSuccessMsg('');
    try {
      const res = await aiGenerateTestCases({
        title: testTitle,
        description: testDesc,
        language: testLanguage,
        starterCode: testStarter,
      });
      if (res?.success && Array.isArray(res.testCases) && res.testCases.length > 0) {
        setTestCases(res.testCases);
        setAiGenSuccessMsg(`✨ Successfully generated ${res.testCases.length} test cases with Gemini AI!`);
        setTimeout(() => setAiGenSuccessMsg(''), 4500);
      } else {
        setAssignError(res?.message || 'Could not generate test cases.');
      }
    } catch (err) {
      setAssignError(err.message || 'Failed to generate test cases with AI.');
    } finally {
      setIsGeneratingTestCases(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setTestLanguage(newLang);

    // 1. Check if we have a matching question in the DB questionsBank for this language
    const matchingDbQ = questionsBank.find(
      (q) => (q.language || '').toLowerCase() === newLang.toLowerCase()
    );

    if (matchingDbQ) {
      setTestTitle(matchingDbQ.title || matchingDbQ.name || '');
      setTestDesc(matchingDbQ.description || '');
      setTestStarter(matchingDbQ.starterCode || '');
      setTestDuration(matchingDbQ.duration || 20);
      return;
    }

    // 2. Unconditional fallback boilerplate and test cases for this specific language
    const preset = FALLBACK_LANG_PRESETS[newLang] || FALLBACK_LANG_PRESETS.javascript;
    setTestTitle(preset.title);
    setTestDesc(preset.desc);
    setTestStarter(preset.starter);
    setTestDuration(preset.duration);
  };

  const handleSendTestAssignment = async () => {
    if (!testTitle.trim() || !testDesc.trim()) {
      setAssignError('Please provide both test title and problem instructions.');
      return;
    }
    setAssigningTest(true);
    setAssignError('');
    try {
      const res = await assignTechnicalTest(testTarget.id, {
        title: testTitle.trim(),
        description: testDesc.trim(),
        language: testLanguage,
        timeLimitMinutes: Number(testDuration) || 30,
        starterCode: testStarter,
        testCases: testCases.filter((tc) => (tc.input && tc.input.trim()) || (tc.expectedOutput && tc.expectedOutput.trim())),
      });

      if (res?.success) {
        setActionMsg(res.message || 'Technical assessment assigned successfully!');
        setTimeout(() => setActionMsg(''), 5000);
        setTestTarget(null);
        loadRequests();
      } else {
        setAssignError(res?.message || 'Failed to assign technical assessment.');
      }
    } catch (err) {
      console.error('Assign test error:', err);
      setAssignError('Network error while assigning assessment.');
    } finally {
      setAssigningTest(false);
    }
  };

  const [evaluatingAI, setEvaluatingAI] = useState(false);

  const openReviewModal = (req) => {
    setReviewTarget(req);
    const existingScore = req.testDetails?.score || '';
    const existingFeedback = req.testDetails?.feedback || '';
    const ai = req.testDetails?.aiEvaluation;

    setReviewScore(existingScore || (ai?.score !== undefined ? `${ai.score}/100 (${ai.verdict || 'AI Scored'})` : ''));
    setReviewFeedback(existingFeedback || (ai?.feedback || ''));
  };

  const handleRunAiEvaluation = async () => {
    if (!reviewTarget) return;
    setEvaluatingAI(true);
    try {
      const res = await aiEvaluateAssessment(reviewTarget.id);
      if (res?.success && res.aiEvaluation) {
        const ai = res.aiEvaluation;
        setReviewTarget((prev) => ({
          ...prev,
          testDetails: {
            ...prev.testDetails,
            aiEvaluation: ai,
          },
        }));
        setReviewScore((prev) => prev || `${ai.score}/100 (${ai.verdict || 'AI Scored'})`);
        setReviewFeedback((prev) => prev || (ai.feedback || ''));
      } else {
        alert(res?.message || 'Could not evaluate code with AI.');
      }
    } catch (err) {
      console.error('AI evaluation error:', err);
      alert('Error running AI evaluation.');
    } finally {
      setEvaluatingAI(false);
    }
  };

  const handleSaveReview = async () => {
    if (!reviewTarget) return;
    setUpdatingReview(true);
    try {
      const res = await reviewTechnicalTest(reviewTarget.id, {
        score: reviewScore,
        feedback: reviewFeedback,
      });
      if (res?.success) {
        setActionMsg('Assessment review and score updated!');
        setTimeout(() => setActionMsg(''), 4000);
        setReviewTarget(null);
        loadRequests();
      } else {
        alert(res?.message || 'Failed to update review.');
      }
    } catch {
      alert('Error updating review.');
    } finally {
      setUpdatingReview(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setFetchError('');
    try {
      const [data, me, qRes] = await Promise.all([
        getMyRequests(), 
        getMe(), 
        getAssessmentQuestions().catch(() => null)
      ]);
      if (me?.success && me.user) {
        setCurrentUser(me.user);
      }
      if (qRes?.success && Array.isArray(qRes.questions) && qRes.questions.length > 0) {
        setQuestionsBank(qRes.questions);
      }
      if (data?.success) {
        setIncoming(data.incoming || []);
        setSent(data.sent || []);
      } else {
        if (!silent) setFetchError(data?.message || 'Failed to load requests. Your session may have expired — please sign in again.');
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
      if (!silent) setFetchError('Network error. Could not connect to the server.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(() => {
      loadRequests(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (id, status) => {
    try {
      const res = await updateRequestStatus(id, status);
      if (res?.success) {
        if (res.noTeam) {
          setActionMsg(res.message || 'Candidate approved! Redirecting to create your team...');
          setTimeout(() => {
            navigate(`/teams?create=true&candidateId=${res.candidateId || ''}&candidateName=${encodeURIComponent(res.candidateName || '')}`);
          }, 1000);
        } else {
          setActionMsg(res.message || `Request ${status} successfully!`);
          setTimeout(() => setActionMsg(''), 4000);
          loadRequests();
        }
      } else {
        alert(res?.message || 'Failed to update request.');
      }
    } catch {
      alert('Failed to update request.');
    }
  };

  const handleMarkSyncCompleted = async (requestId) => {
    try {
      const res = await markInteractionCompleted(requestId);
      if (res?.success) {
        setActionMsg('Video sync interaction marked as verified and completed! ✓');
        setTimeout(() => setActionMsg(''), 4000);
        loadRequests();
      } else {
        alert(res?.message || 'Could not verify sync.');
      }
    } catch {
      alert('Error updating interaction status.');
    }
  };

  const handleAllowCandidate = async (requestId, allow = true) => {
    try {
      const res = await allowCandidateToJoin(requestId, allow);
      if (res?.success) {
        setActionMsg(res.message || (allow ? 'Candidate approved and allowed to join! ✓' : 'Permission revoked.'));
        setTimeout(() => setActionMsg(''), 4000);
        loadRequests();
      } else {
        alert(res?.message || 'Could not update allowance.');
      }
    } catch {
      alert('Error updating candidate admission permission.');
    }
  };

  const handleDeleteRequest = async (id, peerName = 'this request') => {
    if (!window.confirm(`Are you sure you want to delete this request from the database?`)) return;
    try {
      const res = await deleteRequest(id);
      if (res?.success) {
        setActionMsg(res.message || `Request successfully deleted.`);
        setTimeout(() => setActionMsg(''), 4000);
        loadRequests();
      } else {
        alert(res?.message || 'Failed to delete request.');
      }
    } catch {
      alert('Error deleting request.');
    }
  };

  const openInteractionModal = (req) => {
    setInteractionTarget(req);
    setCustomNote(req.customNote || `Hi ${req.name}, let's have an interactive video conference to discuss our collaboration and review details!`);
    const roomId = `CampusCollab-${(req.id || req._id || 'room').toString().slice(-8)}-${Date.now().toString(36)}`;
    setCustomMeetingLink(req.meetingLink || `https://meet.jit.si/${roomId}`);
    setFileUrl(req.fileUrl || '');
    setFileName(req.fileName || '');

    // Default to existing scheduled date or tomorrow
    if (req.scheduledDate) {
      setScheduledDate(req.scheduledDate);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
    }
    setScheduledTime(req.scheduledTime || '16:00');
    setDuration(req.duration || 30);
    setTimezone(req.timezone || 'IST');
    setInteractionError('');
  };

  const handleSendInteraction = async (e) => {
    if (e) e.preventDefault();
    if (!interactionTarget) return;

    setSendingInteraction(true);
    setInteractionError('');
    try {
      const res = await requestPeerInteraction(interactionTarget.id || interactionTarget._id, {
        customNote,
        meetingUrl: customMeetingLink,
        fileUrl,
        fileName,
        scheduledDate,
        scheduledTime,
        duration: Number(duration) || 30,
        timezone,
      });

      if (res?.success) {
        setActionMsg(res.message || `🎥 Scheduled video conference invite email dispatched to ${interactionTarget.name}!`);
        setTimeout(() => setActionMsg(''), 7000);
        setInteractionTarget(null);
        await loadRequests();
      } else {
        setInteractionError(res?.message || 'Failed to dispatch email interaction.');
      }
    } catch {
      setInteractionError('Network error while sending interaction request.');
    } finally {
      setSendingInteraction(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        {/* Header Glass Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-[32px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider">
              <Inbox className="w-3.5 h-3.5 text-amber-300" />
              <span>Peer Collaboration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Collaboration Requests</h1>
            <p className="text-white/70 text-xs sm:text-sm">
              Manage incoming requests from peers and track the status of requests you sent.
            </p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-4 py-2 rounded-2xl glass-tile text-xs font-semibold text-white/90 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
                <span>Logged in as: <strong className="text-white">{currentUser.name}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => loadRequests()}
                disabled={loading || refreshing}
                className="p-2.5 rounded-2xl glass-tile text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
                title="Sync / Refresh requests"
              >
                <RotateCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {actionMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {fetchError && (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-400/40 text-red-200 text-xs font-bold flex items-center justify-between gap-3 backdrop-blur-md">
            <span>⚠ {fetchError}</span>
            <button
              onClick={loadRequests}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-100 text-xs font-bold transition-all cursor-pointer whitespace-nowrap border border-red-400/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab Switcher with silky smooth transitions */}
        <div className="glass-panel-sub p-1.5 rounded-2xl flex gap-2">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-300 ease-out flex items-center justify-center gap-2 cursor-pointer select-none ${
              activeTab === 'incoming'
                ? 'glass-btn-cta text-slate-950 font-black shadow-lg shadow-orange-500/20 scale-[1.01]'
                : 'text-white/70 hover:text-white hover:bg-white/10 active:scale-95'
            }`}
          >
            <Inbox className={`w-4 h-4 shrink-0 transition-transform duration-300 ${activeTab === 'incoming' ? 'scale-110 text-slate-950' : 'text-white/60'}`} />
            <span className="hidden sm:inline">Incoming Requests</span>
            <span className="sm:hidden">Incoming</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors duration-300 ${activeTab === 'incoming' ? 'bg-black/20 text-slate-950 font-bold' : 'bg-white/15 text-white/80'}`}>
              ({incoming.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-300 ease-out flex items-center justify-center gap-2 cursor-pointer select-none ${
              activeTab === 'sent'
                ? 'glass-btn-cta text-slate-950 font-black shadow-lg shadow-orange-500/20 scale-[1.01]'
                : 'text-white/70 hover:text-white hover:bg-white/10 active:scale-95'
            }`}
          >
            <ArrowUpRight className={`w-4 h-4 shrink-0 transition-transform duration-300 ${activeTab === 'sent' ? 'scale-110 text-slate-950' : 'text-white/60'}`} />
            <span className="hidden sm:inline">Sent Requests</span>
            <span className="sm:hidden">Sent</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors duration-300 ${activeTab === 'sent' ? 'bg-black/20 text-slate-950 font-bold' : 'bg-white/15 text-white/80'}`}>
              ({sent.length})
            </span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs text-white/70 font-semibold">Loading collaboration requests...</p>
          </div>
        ) : activeTab === 'incoming' ? (
          <div key="incoming-list" className="space-y-4 animate-fade-in duration-300">
            {incoming.length === 0 ? (
              <div className="glass-panel p-10 rounded-[32px] text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="font-bold text-white text-base">No incoming requests for {currentUser?.name || 'you'}</p>
                <p className="text-xs text-white/70 max-w-md mx-auto">
                  This tab displays requests sent <strong>to {currentUser?.name || 'your account'}</strong> by other peers. To view requests you sent to others, switch to the <strong>Sent Requests</strong> tab.
                </p>
              </div>
            ) : (
              incoming.map((req) => {
                const techList = Array.isArray(req.team?.tech)
                  ? req.team.tech
                  : (req.team?.tech ? String(req.team.tech).split(',') : []);
                const cleanTechList = techList.map(t => String(t).trim()).filter(t => t && t !== '0' && t !== 'null' && t !== 'undefined');

                return (
                  <div key={req.id} className="glass-panel p-5 sm:p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl hover:border-white/15 transition-all">
                    {/* Header: User Info & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-orange-500/20 shrink-0">
                          {req.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-white text-base leading-tight">{req.name}</h3>
                            {req.ranking && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                                <Award className="w-3 h-3 text-amber-400" />
                                <span>{req.ranking}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/50 truncate">{req.department} &bull; {req.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                          req.status === 'accepted'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'rejected'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            req.status === 'accepted' ? 'bg-emerald-400' : req.status === 'rejected' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                          }`} />
                          <span>{req.status === 'accepted' ? 'Accepted' : req.status === 'rejected' ? 'Declined' : 'Pending'}</span>
                        </span>
                        <span className="text-[11px] text-white/50 font-medium hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
                          <Clock className="w-3 h-3 text-amber-400/80" /> {req.time}
                        </span>
                      </div>
                    </div>

                    {/* Team Context & Role Chips */}
                    {(req.team || req.role) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {req.team && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/10 text-amber-200 border border-amber-400/25 font-medium">
                            <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              {req.requestType === 'team_join_request' ? 'Request to Join: ' : 'Invitation to Join: '}
                              <strong className="text-white font-bold">{req.team.title}</strong>
                            </span>
                          </span>
                        )}
                        {req.role && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white/[0.06] text-white/90 border border-white/15 text-xs font-semibold">
                            Role: <strong className="text-amber-300 ml-1 font-bold">{req.role}</strong>
                          </span>
                        )}
                        {cleanTechList.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-white/60">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Message Quote */}
                    {req.message && (
                      <div className="relative pl-3.5 border-l-2 border-amber-400/40 text-xs text-white/80 italic leading-relaxed py-0.5">
                        "{req.message}"
                      </div>
                    )}

                    {/* Attached File */}
                    {req.fileUrl && (
                      <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-medium text-white truncate">{req.fileName || 'Shared Document'}</span>
                        </div>
                        <a
                          href={req.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-300 hover:text-white font-bold flex items-center gap-1 transition-all text-xs shrink-0 ml-3"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Actionable Sub-Cards: Video Sync & Coding Assessment */}
                    <div className="space-y-2 pt-1">
                      <VideoSyncRow req={req} onOpenInteraction={openInteractionModal} onMarkSyncCompleted={handleMarkSyncCompleted} />
                      <AssessmentRow
                        req={req}
                        currentUserId={currentUser?._id || currentUser?.id}
                        tab="incoming"
                        onOpenAssign={openAssignTestModal}
                        onOpenReview={openReviewModal}
                      />
                    </div>

                    {/* Verification & Admission Lock Status Banner */}
                    {(() => {
                      if (req.requestType === 'team_join_request') {
                        if (req.status === 'pending') {
                          return (
                            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs flex items-center gap-2.5">
                              <UserCheck className="w-4 h-4 shrink-0 text-blue-400" />
                              <div className="min-w-0">
                                <span className="font-bold">Student Membership Application:</span>
                                <span className="text-white/80 ml-1.5">
                                  {req.name} has requested to join your squad as <strong>{req.role || 'Contributor'}</strong>. Review their credentials and click "Accept & Add" to admit them.
                                </span>
                              </div>
                            </div>
                          );
                        }
                      } else {
                        if (!req.leadAllowedJoin && req.status === 'pending') {
                          return (
                            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/25 text-amber-300 text-xs flex items-center gap-2.5">
                              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                              <div className="min-w-0">
                                <span className="font-bold">Awaiting Sender / Team Lead Approval:</span>
                                <span className="text-white/80 ml-1.5">
                                  You received an offer from {req.name}, but you cannot accept until they click "Allow to Join" or approve your offer.
                                </span>
                              </div>
                            </div>
                          );
                        }

                        if (req.leadAllowedJoin && req.status === 'pending') {
                          return (
                            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                              <div className="min-w-0">
                                <span className="font-bold">Sender / Lead Approved:</span>
                                <span className="text-white/80 ml-1.5">
                                  Permission has been granted! You can now accept this offer below.
                                </span>
                              </div>
                            </div>
                          );
                        }
                      }

                      const testPending = req.testDetails?.isAssigned && req.testDetails?.status !== 'completed';
                      const syncPending = req.interactionRequested && !req.interactionCompleted;
                      const isLocked = testPending || syncPending;
                      if (!isLocked || req.status !== 'pending') return null;

                      const pendingItems = [
                        testPending && 'Technical Coding Test must be completed',
                        syncPending && 'Scheduled Video Call must be held & verified',
                      ].filter(Boolean);

                      return (
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/25 text-amber-300 text-xs flex items-center gap-2.5">
                          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                          <div className="min-w-0">
                            <span className="font-bold">Acceptance Locked:</span>
                            <span className="text-white/80 ml-1.5">{pendingItems.join(' • ')}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          setViewingProfile(req.profile || req);
                          setViewingRequest(req);
                        }}
                        className="glass-btn-ghost py-1.5 px-3 rounded-xl text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>Profile & Repos</span>
                      </button>

                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {req.status === 'pending' && (
                          <>
                            {(() => {
                              const isJoinRequest = req.requestType === 'team_join_request';
                              const leadNotAllowedYet = !isJoinRequest && !req.leadAllowedJoin;
                              const testPending = req.testDetails?.isAssigned && req.testDetails?.status !== 'completed';
                              const syncPending = req.interactionRequested && !req.interactionCompleted;
                              const isLocked = leadNotAllowedYet || testPending || syncPending;

                              if (leadNotAllowedYet) {
                                return (
                                  <button
                                    disabled
                                    title="The request sender / Team Lead must allow you to join or accept your offer before you can accept."
                                    className="py-1.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-70"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Accept Offer (Awaiting Approval)</span>
                                  </button>
                                );
                              }

                              if (isLocked) {
                                const reason = [testPending && 'Coding Test Pending', syncPending && 'Video Call Pending'].filter(Boolean).join(' & ');
                                return (
                                  <button
                                    disabled
                                    title={`Acceptance is locked until verifications are complete: ${reason}`}
                                    className="py-1.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-70"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{req.requestType === 'team_join_request' ? 'Accept & Add (Locked)' : req.team ? 'Accept & Join (Locked)' : 'Accept Offer (Locked)'}</span>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  onClick={() => handleRespond(req.id, 'accepted')}
                                  className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{req.requestType === 'team_join_request' ? 'Accept & Add' : req.team ? 'Accept & Join' : 'Accept Offer'}</span>
                                </button>
                              );
                            })()}
                            <button
                              onClick={() => handleRespond(req.id, 'rejected')}
                              className="glass-btn-ghost py-1.5 px-3 rounded-xl text-red-300 hover:text-red-200 border-red-500/30 hover:bg-red-500/10 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-400" /> Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteRequest(req.id, req.name)}
                          className="glass-btn-ghost py-1.5 px-2.5 rounded-xl text-white/50 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Delete this request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div key="sent-list" className="space-y-4 animate-fade-in duration-300">
            {sent.length === 0 ? (
              <div className="glass-panel p-10 rounded-[32px] text-center space-y-3">
                <Send className="w-12 h-12 text-amber-400 mx-auto" />
                <p className="font-bold text-white text-base">No sent requests yet</p>
                <p className="text-xs text-white/70">Go to Find Peers to request help or invite others to your team!</p>
              </div>
            ) : (
              sent.map((req) => {
                const techList = Array.isArray(req.team?.tech)
                  ? req.team.tech
                  : (req.team?.tech ? String(req.team.tech).split(',') : []);
                const cleanTechList = techList.map(t => String(t).trim()).filter(t => t && t !== '0' && t !== 'null' && t !== 'undefined');

                return (
                  <div key={req.id} className="glass-panel p-5 sm:p-6 rounded-[24px] border border-white/10 space-y-4 shadow-xl hover:border-white/15 transition-all">
                    {/* Header: User Info & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0">
                          {req.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-base leading-tight">To: {req.name}</h3>
                          <p className="text-xs text-white/50 truncate">{req.department} &bull; {req.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                          req.status === 'accepted'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'rejected'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            req.status === 'accepted' ? 'bg-emerald-400' : req.status === 'rejected' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                          }`} />
                          <span>{req.status === 'accepted' ? 'Accepted' : req.status === 'rejected' ? 'Declined' : 'Pending Response'}</span>
                        </span>
                        <span className="text-[11px] text-white/50 font-medium hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
                          <Clock className="w-3 h-3 text-white/40" /> {req.time}
                        </span>
                      </div>
                    </div>

                    {/* Team Context & Role Chips */}
                    {(req.team || req.role) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {req.team && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/10 text-amber-200 border border-amber-400/25 font-medium">
                            <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              {req.requestType === 'team_join_request' ? 'Request Sent to Join: ' : 'Invitation Sent to Join: '}
                              <strong className="text-white font-bold">{req.team.title}</strong>
                            </span>
                          </span>
                        )}
                        {req.role && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white/[0.06] text-white/90 border border-white/15 text-xs font-semibold">
                            Role: <strong className="text-amber-300 ml-1 font-bold">{req.role}</strong>
                          </span>
                        )}
                        {cleanTechList.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-white/60">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Message Quote */}
                    {req.message && (
                      <div className="relative pl-3.5 border-l-2 border-white/20 text-xs text-white/80 italic leading-relaxed py-0.5">
                        "{req.message}"
                      </div>
                    )}

                    {/* Attached File */}
                    {req.fileUrl && (
                      <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-medium text-white truncate">{req.fileName || 'Shared Document'}</span>
                        </div>
                        <a
                          href={req.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-300 hover:text-white font-bold flex items-center gap-1 transition-all text-xs shrink-0 ml-3"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Actionable Sub-Cards: Video Sync & Coding Assessment */}
                    <div className="space-y-2 pt-1">
                      <VideoSyncRow req={req} onOpenInteraction={openInteractionModal} onMarkSyncCompleted={handleMarkSyncCompleted} />
                      <AssessmentRow
                        req={req}
                        currentUserId={currentUser?._id || currentUser?.id}
                        tab="sent"
                        onOpenAssign={openAssignTestModal}
                        onOpenReview={openReviewModal}
                      />
                    </div>

                    {/* Team Lead / Sender Admission Guard Banner */}
                    {(() => {
                      if (req.status !== 'pending') return null;

                      if (req.requestType === 'team_join_request') {
                        return (
                          <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs flex items-center gap-2.5">
                            <Clock className="w-4 h-4 shrink-0 text-blue-400" />
                            <div className="min-w-0">
                              <span className="font-bold">Application Under Review:</span>
                              <span className="text-white/80 ml-1.5">
                                Your request to join team <strong>{req.team?.title || 'the squad'}</strong> has been sent to {req.name}. You will receive a notification as soon as they make a decision.
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className={`p-2.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                          req.leadAllowedJoin 
                            ? 'bg-emerald-500/10 border border-emerald-400/25 text-emerald-300' 
                            : 'bg-amber-500/10 border border-amber-400/25 text-amber-300'
                        }`}>
                          {req.leadAllowedJoin ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                              <div className="min-w-0">
                                <span className="font-bold">Candidate Allowed to Join:</span>
                                <span className="text-white/80 ml-1.5">You approved this candidate. They can accept your offer, or you can click "Accept Offer" below.</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                              <div className="min-w-0">
                                <span className="font-bold">Candidate Acceptance Guarded:</span>
                                <span className="text-white/80 ml-1.5">Candidate cannot accept until you click "Allow to Join" or directly click "Accept Offer".</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          setViewingProfile(req.profile || req);
                          setViewingRequest(req);
                        }}
                        className="glass-btn-ghost py-1.5 px-3 rounded-xl text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>Profile & Repos</span>
                      </button>

                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* For sent requests, sender can Allow to Join or Cancel */}
                        {req.status === 'pending' && (
                          <>
                            {req.requestType !== 'team_join_request' && (
                              <button
                                onClick={() => handleAllowCandidate(req.id, !req.leadAllowedJoin)}
                                className={`py-1.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  req.leadAllowedJoin
                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-300'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300'
                                }`}
                                title={req.leadAllowedJoin ? 'Click to revoke join permission' : 'Allow candidate to accept and join'}
                              >
                                {req.leadAllowedJoin ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Allowed to Join ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Allow to Join</span>
                                  </>
                                )}
                              </button>
                            )}

                            {req.requestType !== 'team_join_request' && (
                              <button
                                onClick={() => handleRespond(req.id, 'rejected')}
                                className="glass-btn-ghost py-1.5 px-2.5 rounded-xl text-red-300 hover:text-red-200 border-red-500/30 hover:bg-red-500/10 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Cancel invitation"
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-400" /> Cancel
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteRequest(req.id, req.name)}
                          className="glass-btn-ghost py-1.5 px-3 rounded-xl text-white/50 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Withdraw and delete this request"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete Request</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewingProfile && (
          <PeerProfileModal
            profile={viewingProfile}
            requestContext={viewingRequest}
            isSentTab={activeTab === 'sent'}
            onClose={() => {
              setViewingProfile(null);
              setViewingRequest(null);
            }}
            onAccept={(id) => handleRespond(id, 'accepted')}
            onReject={(id) => handleRespond(id, 'rejected')}
            onOpenInteraction={openInteractionModal}
            onAllowCandidate={(id, allow) => handleAllowCandidate(id, allow)}
          />
        )}

        {/* Video Call Interaction Modal */}
        {interactionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-[32px] glass-panel p-4 sm:p-7 shadow-2xl border border-white/30 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-white/15">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl glass-tile text-amber-400 border border-amber-400/30">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Video Conference & Project Review</h3>
                    <p className="text-xs text-white/70">Connect with {interactionTarget.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInteractionTarget(null)}
                  className="text-white/60 hover:text-white cursor-pointer p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {interactionError && (
                <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-semibold backdrop-blur-md">
                  ⚠ {interactionError}
                </div>
              )}

              <div className="p-4 rounded-2xl glass-panel-sub border border-white/15 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-white/90 font-semibold">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Invitation Email will go to:</span>
                  <strong className="text-white underline">{interactionTarget.email}</strong>
                </div>
                <p className="text-white/70 text-[11px] leading-relaxed">
                  An invitation email with the video call link and your collaboration note will be sent directly to this member's inbox.
                </p>
              </div>

              {/* Phase 3: Scheduled Sync Date & Time */}
              <div className="p-4 rounded-2xl glass-tile border border-amber-400/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Phase 3: Scheduled Sync Appointment *</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/90">Scheduled Date *</label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/90">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/90">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none cursor-pointer"
                    >
                      <option value={15}>15 minutes (Quick intro)</option>
                      <option value={20}>20 minutes (Sync & check)</option>
                      <option value={30}>30 minutes (Standard sync)</option>
                      <option value={45}>45 minutes (In-depth review)</option>
                      <option value={60}>60 minutes (Technical session)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/90">Timezone</label>
                    <input
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none font-mono"
                      placeholder="e.g. IST (UTC+5:30)"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/90 flex items-center justify-between">
                  <span>Video Conference Room URL (WebRTC)</span>
                  <span className="text-[10px] text-amber-300/80 font-mono">Bound to Appointment</span>
                </label>
                <input
                  type="text"
                  value={customMeetingLink}
                  onChange={(e) => setCustomMeetingLink(e.target.value)}
                  className="w-full rounded-2xl glass-input-field px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none font-mono"
                  placeholder="https://meet.jit.si/..."
                />
              </div>

              {/* Project / Reference File Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                    <span>Project File / Doc Link (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full rounded-2xl glass-input-field px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none font-mono"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>File Title / Description</span>
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full rounded-2xl glass-input-field px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none"
                    placeholder="e.g., Hackathon Architecture.pdf"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/90">
                  Discussion Agenda & Note
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full rounded-2xl glass-input-field p-3.5 text-xs text-white placeholder-white/40 focus:outline-none resize-none"
                  placeholder="e.g., Let's connect on video to discuss project architecture and inspect files..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInteractionTarget(null)}
                  disabled={sendingInteraction}
                  className="glass-btn-ghost px-4 py-2.5 text-xs font-semibold text-white/80 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendInteraction}
                  disabled={sendingInteraction}
                  className="glass-btn-cta px-5 py-2.5 text-xs font-black rounded-xl text-slate-950 flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {sendingInteraction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Video Conference Invite Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ======================================================== */}
        {/* ASSIGN TECHNICAL TEST MODAL                             */}
        {/* ======================================================== */}
        {testTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
            <div className="w-full max-w-2xl max-h-[92vh] glass-panel p-4 sm:p-7 rounded-2xl sm:rounded-[32px] border border-orange-500/40 shadow-2xl flex flex-col space-y-4 overflow-y-auto">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-md">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Assign Technical Coding Assessment</h3>
                    <p className="text-xs text-white/70">
                      Candidate: <strong className="text-white">{testTarget.name}</strong> &bull; Team: <strong className="text-orange-400">{testTarget.team?.title || 'Project'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTestTarget(null)}
                  className="p-2 rounded-xl glass-btn-ghost text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {assignError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              {/* Quick Presets Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-orange-300 uppercase tracking-wider block">
                  ⚡ Quick Assessment Presets (1-Click Fill):
                </label>
                <div className="flex flex-wrap gap-2">
                  {questionsBank.map((p, idx) => {
                    const isCurrent = p.language === testLanguage;
                    return (
                      <button
                        key={p._id || idx}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-all flex items-center gap-1.5 ${
                          isCurrent
                            ? 'bg-orange-500/25 text-orange-200 border-orange-500/60 shadow-md shadow-orange-500/10'
                            : 'bg-slate-900/90 text-white/70 hover:text-white border-white/10 hover:border-orange-500/30'
                        }`}
                      >
                        <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-black/40 font-mono text-orange-300 font-bold">
                          {p.language === 'cpp' ? 'C++' : p.language ? p.language.toUpperCase() : 'CODE'}
                        </span>
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-white/90">Challenge Title *</label>
                  <input
                    type="text"
                    required
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                    placeholder="e.g. React & Node State Manipulation"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/90">Language</label>
                  <select
                    value={testLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none cursor-pointer"
                  >
                    <option value="javascript">JavaScript (Node/Browser)</option>
                    <option value="python">Python 3</option>
                    <option value="cpp">C++ (GCC)</option>
                    <option value="c">C (GCC)</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                </div>
              </div>

              {/* Duration & Time Limit */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Time Limit</label>
                <select
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number(e.target.value))}
                  className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none cursor-pointer"
                >
                  <option value={15}>15 Minutes (Quick Syntax / Logic Check)</option>
                  <option value={20}>20 Minutes (Standard Coding Task)</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={45}>45 Minutes (Comprehensive Algorithm / Component)</option>
                  <option value={60}>60 Minutes (Full Stack Challenge)</option>
                </select>
              </div>

              {/* Problem Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">
                  Problem Statement, Requirements & Test Cases *
                </label>
                <textarea
                  rows={5}
                  required
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                  className="w-full rounded-2xl glass-input-field p-3 text-xs text-white placeholder-white/40 focus:outline-none font-sans"
                  placeholder="Describe the function to write, input arguments, expected return format, and edge cases..."
                />
              </div>

              {/* Starter Code */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90 flex items-center justify-between">
                  <span>Starter Boilerplate Code (Shown in Monaco Editor)</span>
                  <span className="text-[10px] text-amber-300 font-mono">VS Code Ready</span>
                </label>
                <textarea
                  rows={4}
                  value={testStarter}
                  onChange={(e) => setTestStarter(e.target.value)}
                  className="w-full rounded-2xl glass-input-field p-3 font-mono text-xs text-amber-300 placeholder-white/40 focus:outline-none"
                  placeholder="// Function signature and boilerplate..."
                />
              </div>

              {/* Test Cases & Assertions */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sample Test Cases & Assertions ({testCases.length})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAiTestCases}
                      disabled={isGeneratingTestCases}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all border border-amber-400/40 cursor-pointer disabled:opacity-50 shadow-sm"
                      title="Analyze problem description & starter code with Gemini to auto-generate edge cases"
                    >
                      {isGeneratingTestCases ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                          <span>Generating with Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Generate with AI</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestCases([...testCases, { input: '', expectedOutput: '', explanation: '' }])}
                      className="px-2.5 py-1 rounded-xl glass-btn-ghost text-amber-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all border border-amber-400/30 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Test Case
                    </button>
                  </div>
                </div>

                {aiGenSuccessMsg && (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5 animate-fadeIn">
                    <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{aiGenSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl glass-tile border border-white/10 space-y-2 relative group hover:border-amber-400/40 transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300">Test Case #{idx + 1}</span>
                        {testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                            className="text-white/40 hover:text-red-400 font-bold transition-colors cursor-pointer"
                            title="Remove test case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-white/70 font-semibold block mb-0.5">Input / Arguments</label>
                          <input
                            type="text"
                            value={tc.input}
                            onChange={(e) => {
                              const updated = [...testCases];
                              updated[idx].input = e.target.value;
                              setTestCases(updated);
                            }}
                            placeholder='e.g. "CampusCollab" or [2, 7, 11, 15]'
                            className="w-full px-2.5 py-1.5 rounded-xl glass-input-field text-xs text-white placeholder-white/30 font-mono focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-white/70 font-semibold block mb-0.5">Expected Output</label>
                          <input
                            type="text"
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const updated = [...testCases];
                              updated[idx].expectedOutput = e.target.value;
                              setTestCases(updated);
                            }}
                            placeholder='e.g. "balloCsupmaC" or [0, 1]'
                            className="w-full px-2.5 py-1.5 rounded-xl glass-input-field text-xs text-emerald-300 placeholder-white/30 font-mono focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security info notice */}
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-[11px] text-orange-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-orange-300">
                  <ShieldAlert className="w-3.5 h-3.5" /> Automated Proctored Rules
                </p>
                <p className="text-white/70">
                  The candidate must complete the test in Fullscreen Mode inside the browser's embedded VS Code editor. Tab switches, window minimization, or navigating to external apps will trigger violation strikes. Reaching 3 strikes auto-terminates the test.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setTestTarget(null)}
                  disabled={assigningTest}
                  className="glass-btn-ghost px-4 py-2 text-xs font-bold text-white/70 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendTestAssignment}
                  disabled={assigningTest}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {assigningTest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Assessment...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Assessment to {testTarget.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ======================================================== */}
        {/* REVIEW TECHNICAL ASSESSMENT MODAL                        */}
        {/* ======================================================== */}
        {reviewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
            <div className="w-full max-w-3xl max-h-[92vh] glass-panel p-4 sm:p-7 rounded-2xl sm:rounded-[32px] border border-orange-500/40 shadow-2xl flex flex-col space-y-4 overflow-hidden text-slate-100">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-md">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>Assessment Review: {reviewTarget.testDetails?.title}</span>
                      {reviewTarget.testDetails?.status === 'terminated_violations' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                          Terminated (3 Strikes)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Submitted (Clean)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-white/70">
                      Candidate: <strong className="text-white">{reviewTarget.name}</strong> &bull; Role: <strong className="text-orange-400">{reviewTarget.role || 'Member'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReviewTarget(null)}
                  className="p-2 rounded-xl glass-btn-ghost text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
                
                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Time Taken</span>
                    <p className="font-extrabold text-white text-sm">
                      {Math.floor((reviewTarget.testDetails?.timeSpentSeconds || 0) / 60)}m {(reviewTarget.testDetails?.timeSpentSeconds || 0) % 60}s
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Security Integrity</span>
                    <p className={`font-extrabold text-sm ${reviewTarget.testDetails?.violationsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {reviewTarget.testDetails?.violationsCount || 0} / 3 Strikes
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted At</span>
                    <p className="font-extrabold text-white text-sm">
                      {reviewTarget.testDetails?.submittedAt ? new Date(reviewTarget.testDetails.submittedAt).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Submitted Code Block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-orange-300">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-orange-400" />
                      <span>Candidate's Submitted Code:</span>
                    </span>
                    <button
                      onClick={() => {
                        if (reviewTarget.testDetails?.submittedCode) {
                          navigator.clipboard.writeText(reviewTarget.testDetails.submittedCode);
                          alert('Code copied to clipboard!');
                        }
                      }}
                      className="text-[11px] text-white/70 hover:text-white cursor-pointer"
                    >
                      Copy Code
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-56 leading-relaxed select-text">
                    {reviewTarget.testDetails?.submittedCode || '// No code submitted'}
                  </pre>
                </div>

                {/* Console Output Log */}
                {reviewTarget.testDetails?.outputLog && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Execution Sandbox Output:
                    </span>
                    <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto whitespace-pre-wrap max-h-28">
                      {reviewTarget.testDetails.outputLog}
                    </pre>
                  </div>
                )}

                {/* Anti-Cheat Audit Trail Log */}
                {reviewTarget.testDetails?.violationLogs?.length > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-1.5">
                    <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Anti-Cheat Audit Events ({reviewTarget.testDetails.violationLogs.length}):
                    </span>
                    <ul className="text-[11px] text-red-200 font-mono space-y-1 list-disc list-inside">
                      {reviewTarget.testDetails.violationLogs.map((item, idx) => (
                        <li key={idx}>
                          <span className="text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}:</span> {item.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Clean Security Record: Zero window-switches or blur events were recorded during the assessment.</span>
                  </div>
                )}

                {/* Gemini AI Code Assessment & Auto-Scoring Card */}
                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-sky-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-2 flex-wrap">
                          <span>Gemini AI Code Assessment</span>
                          {reviewTarget.testDetails?.aiEvaluation?.verdict && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              reviewTarget.testDetails.aiEvaluation.verdict === 'Passed'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {reviewTarget.testDetails.aiEvaluation.verdict}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-white/60">Automated complexity, edge case, and code quality scoring</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunAiEvaluation}
                      disabled={evaluatingAI}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-60 transition-all self-start sm:self-auto"
                    >
                      {evaluatingAI ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{reviewTarget.testDetails?.aiEvaluation ? 'Re-Evaluate with AI' : 'Run AI Evaluation'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {reviewTarget.testDetails?.aiEvaluation && (
                    <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                          <span className="text-[10px] text-white/50 block">AI Score</span>
                          <span className="text-sm font-black text-blue-400">
                            {reviewTarget.testDetails.aiEvaluation.score !== undefined ? `${reviewTarget.testDetails.aiEvaluation.score}/100` : 'N/A'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                          <span className="text-[10px] text-white/50 block">Time Complexity</span>
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {reviewTarget.testDetails.aiEvaluation.timeComplexity || 'O(n)'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                          <span className="text-[10px] text-white/50 block">Space Complexity</span>
                          <span className="text-xs font-mono font-bold text-sky-300">
                            {reviewTarget.testDetails.aiEvaluation.spaceComplexity || 'O(1)'}
                          </span>
                        </div>
                      </div>

                      {reviewTarget.testDetails.aiEvaluation.strengths && (
                        <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                          <strong>Strengths:</strong> {reviewTarget.testDetails.aiEvaluation.strengths}
                        </p>
                      )}
                      {reviewTarget.testDetails.aiEvaluation.improvements && (
                        <p className="text-[11px] text-amber-300/90 leading-relaxed">
                          <strong>Suggested Improvements:</strong> {reviewTarget.testDetails.aiEvaluation.improvements}
                        </p>
                      )}
                      {reviewTarget.testDetails.aiEvaluation.feedback && (
                        <p className="text-[11px] text-white/80 leading-relaxed italic bg-black/20 p-2.5 rounded-xl border border-white/10">
                          "{reviewTarget.testDetails.aiEvaluation.feedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Lead Grading & Feedback */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/90">Score / Grade</label>
                    <input
                      type="text"
                      value={reviewScore}
                      onChange={(e) => setReviewScore(e.target.value)}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                      placeholder="e.g. 9/10 or Passed"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-white/90">Feedback Notes (Optional)</label>
                    <input
                      type="text"
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                      placeholder="e.g. Excellent array filtering logic and clean syntax."
                    />
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleRespond(reviewTarget.id, 'accepted');
                      setReviewTarget(null);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Add to Team
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRespond(reviewTarget.id, 'rejected');
                      setReviewTarget(null);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl glass-btn-ghost text-red-300 hover:text-red-200 border-red-500/30 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-400" /> Reject
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleSaveReview}
                    disabled={updatingReview}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                  >
                    {updatingReview ? 'Saving...' : 'Save Grade & Feedback'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewTarget(null)}
                    className="px-4 py-2 rounded-xl glass-btn-ghost text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Requests;
