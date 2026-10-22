import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Play,
  Send,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Maximize2,
  Minimize2,
  Terminal,
  FileCode,
  Users,
  Eye,
  Lock,
  Loader2,
  Sparkles,
  Info
} from 'lucide-react';
import { getTechnicalTest, startTechnicalTest, submitTechnicalTest, executeCodeApi } from '../../API/peers';

export function SecureCodingTest() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [testData, setTestData] = useState(null);

  // Test lifecycle: 'gate' | 'testing' | 'submitted'
  const [phase, setPhase] = useState('gate');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Editor & Code state
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  // Timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  // Responsive mobile active view: 'problem' | 'editor' | 'console'
  const [mobileTab, setMobileTab] = useState('editor');

  // Anti-cheat monitoring state
  const [strikes, setStrikes] = useState(0);
  const [violationLogs, setViolationLogs] = useState([]);
  const [activeWarning, setActiveWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const strikesRef = useRef(0);
  const violationLogsRef = useRef([]);
  const timeSpentRef = useRef(0);
  const codeRef = useRef('');
  const outputRef = useRef('');
  const isSubmittingRef = useRef(false);

  // Sync refs for event handlers
  useEffect(() => {
    strikesRef.current = strikes;
  }, [strikes]);

  useEffect(() => {
    violationLogsRef.current = violationLogs;
  }, [violationLogs]);

  useEffect(() => {
    timeSpentRef.current = timeSpentSeconds;
  }, [timeSpentSeconds]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    outputRef.current = output;
  }, [output]);

  // Load test data
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await getTechnicalTest(requestId);
        if (res?.success && res.test) {
          setTestData(res);
          const lang = (res.test.language || 'javascript').toLowerCase();
          const defaultBoilerplate =
            lang === 'c'
              ? '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    // Write your C solution here\n    printf("Running C test...\\n");\n    return 0;\n}\n'
              : lang === 'cpp' || lang === 'c++'
              ? '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ solution here\n    cout << "Running C++ test..." << endl;\n    return 0;\n}\n'
              : lang === 'python' || lang === 'py'
              ? 'def solution():\n    # Write your Python solution here\n    print("Running Python test...")\n\nif __name__ == "__main__":\n    solution()\n'
              : '// Write your solution here\n';

          setCode(res.test.submittedCode || res.test.starterCode || defaultBoilerplate);
          setTimeLeftSeconds((res.test.timeLimitMinutes || 30) * 60);

          if (res.test.status === 'completed' || res.test.status === 'terminated_violations') {
            setPhase('submitted');
            setStrikes(res.test.violationsCount || 0);
            setViolationLogs(res.test.violationLogs || []);
            setOutput(res.test.outputLog || '');
          }
        } else {
          setErrorMsg(res?.message || 'Unable to load technical assessment.');
        }
      } catch (err) {
        console.error('Failed to load test:', err);
        setErrorMsg('Network error while connecting to assessment server.');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [requestId]);

  // Record a security violation strike
  const recordViolation = (type, description) => {
    if (isSubmittingRef.current || phase !== 'testing') return;

    const newStrike = strikesRef.current + 1;
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      description,
    };

    const newLogs = [...violationLogsRef.current, logEntry];
    setStrikes(newStrike);
    setViolationLogs(newLogs);
    strikesRef.current = newStrike;
    violationLogsRef.current = newLogs;

    if (newStrike >= 3) {
      handleAutoTerminate(newLogs, newStrike);
    } else {
      setActiveWarning({
        strike: newStrike,
        maxStrikes: 3,
        message: description,
      });
    }
  };

  // Auto-terminate on 3rd violation
  const handleAutoTerminate = async (finalLogs, finalStrikes) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      await submitTechnicalTest(requestId, {
        submittedCode: codeRef.current,
        timeSpentSeconds: timeSpentRef.current,
        violationsCount: finalStrikes,
        violationLogs: finalLogs,
        outputLog: outputRef.current + '\n[Security Monitor] Test auto-terminated: 3 violation strikes reached.',
        autoTerminated: true,
      });
      setPhase('submitted');
      setActiveWarning(null);
    } catch (err) {
      console.error('Auto-terminate submit error:', err);
      setPhase('submitted');
    } finally {
      setSubmitting(false);
    }
  };

  // Anti-Cheat Event Listeners (Tab switch, window blur, fullscreen exit)
  useEffect(() => {
    if (phase !== 'testing') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('tab_switch', 'Navigated away or switched browser tabs during the test.');
      }
    };

    const handleWindowBlur = () => {
      recordViolation('window_blur', 'Window focus lost. Opened another app (e.g. VS Code, browser window, or devtools).');
    };

    const handleFullscreenChange = () => {
      const inFull = Boolean(document.fullscreenElement);
      setIsFullscreen(inFull);
      if (!inFull && !isSubmittingRef.current) {
        recordViolation('fullscreen_exit', 'Exited mandatory Fullscreen Mode.');
      }
    };

    const handlePaste = (e) => {
      recordViolation('paste_attempt', 'Attempted to paste external code into the editor.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('paste', handlePaste);
    };
  }, [phase]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'testing') return;

    const timer = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Start test in Fullscreen
  const handleStartTest = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed:', err);
    }

    try {
      await startTechnicalTest(requestId);
    } catch (err) {
      console.error('Error recording test start:', err);
    }

    setPhase('testing');
  };

  // Run code safely in sandbox via backend compiler (C, C++, Python, JavaScript)
  const handleRunCode = async () => {
    setIsRunning(true);
    const lang = test?.language || 'javascript';
    setOutput(`[Compiler] Compiling and running ${lang.toUpperCase()} in secure sandbox...\n`);

    // On mobile, auto-switch to console tab so the candidate sees compilation feedback
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileTab('console');
    }

    try {
      const res = await executeCodeApi({
        code: codeRef.current || code,
        language: lang,
        stdin,
      });

      if (res?.success) {
        let finalOutput = res.output || '✓ Code executed successfully with 0 errors (No standard output returned).';
        finalOutput += `\n\n[Execution time: ${res.executionTimeMs || 0} ms • Environment: ${res.language || lang}]`;
        setOutput(finalOutput);
      } else if (res?.isCompileError) {
        setOutput(`⚠️ Compilation / Syntax Error:\n${res.output || 'Could not compile source code.'}\n\n[Time: ${res.executionTimeMs || 0} ms]`);
      } else {
        setOutput(res?.output || res?.message || 'Execution failed.');
      }
    } catch (err) {
      console.warn('Backend compiler failed, attempting local fallback if JS:', err);
      if (lang === 'javascript' || lang === 'js') {
        try {
          const logs = [];
          const customConsole = {
            log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
            error: (...args) => logs.push('[ERROR] ' + args.join(' ')),
            warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
          };
          const runFn = new Function('console', codeRef.current || code);
          const t0 = performance.now();
          const result = runFn(customConsole);
          const t1 = performance.now();
          let finalOutput = logs.join('\n');
          if (result !== undefined) {
            finalOutput += `\n→ Returned: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
          }
          if (!finalOutput.trim()) finalOutput = '✓ Code executed successfully with 0 errors.';
          finalOutput += `\n\n[Execution time: ${(t1 - t0).toFixed(2)} ms (Client JS Fallback)]`;
          setOutput(finalOutput);
        } catch (jsErr) {
          setOutput(`Runtime Exception:\n${jsErr.name}: ${jsErr.message}`);
        }
      } else {
        setOutput(`Execution Error:\n${err.message || 'Could not connect to compilation server.'}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunCodeWithInput = async (customStdin, expectedOut) => {
    setIsRunning(true);
    const lang = test?.language || 'javascript';
    setOutput(`[Compiler] Running code against Test Case (Input: "${customStdin || 'None'}")...\n`);

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileTab('console');
    }

    try {
      const res = await executeCodeApi({
        code: codeRef.current || code,
        language: lang,
        stdin: customStdin || '',
      });

      if (res?.success) {
        const actualOut = (res.output || '').trim();
        const expected = (expectedOut || '').trim();
        let matchBanner = '';
        if (expected) {
          const isMatch = actualOut === expected || actualOut.includes(expected);
          matchBanner = isMatch
            ? `\n\n🎉 [TEST CASE PASSED]\nExpected Output: "${expected}"\nYour Output:     "${actualOut}"`
            : `\n\n❌ [TEST CASE FAILED - OUTPUT MISMATCH]\nExpected Output: "${expected}"\nYour Output:     "${actualOut}"`;
        }

        let finalOutput = res.output || '✓ Code executed with no standard output.';
        finalOutput += matchBanner;
        finalOutput += `\n\n[Execution time: ${res.executionTimeMs || 0} ms • Environment: ${res.language || lang}]`;
        setOutput(finalOutput);
      } else if (res?.isCompileError) {
        setOutput(`⚠️ Compilation / Syntax Error:\n${res.output || 'Could not compile source code.'}`);
      } else {
        setOutput(res?.output || res?.message || 'Execution failed.');
      }
    } catch (err) {
      setOutput(`Execution Error: ${err.message || 'Could not connect to compiler.'}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit test
  const handleSubmitTest = async (isTimeout = false) => {
    if (isSubmittingRef.current) return;
    if (!isTimeout && !window.confirm('Are you ready to submit your code? You will not be able to edit after submission.')) {
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const res = await submitTechnicalTest(requestId, {
        submittedCode: codeRef.current,
        timeSpentSeconds: timeSpentRef.current,
        violationsCount: strikesRef.current,
        violationLogs: violationLogsRef.current,
        outputLog: outputRef.current || (isTimeout ? 'Test auto-submitted: Time limit expired.' : 'Submitted normally.'),
        autoTerminated: strikesRef.current >= 3,
      });

      if (res?.success) {
        setPhase('submitted');
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } else {
        alert(res?.message || 'Failed to submit assessment.');
      }
    } catch (err) {
      console.error('Submit test error:', err);
      alert('Error submitting test.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-orange-500" />
        <p className="text-sm font-bold text-slate-400">Initializing Secure Assessment Environment...</p>
      </div>
    );
  }

  if (errorMsg || !testData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center space-y-4">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
          <h2 className="text-lg font-black">Assessment Error</h2>
          <p className="text-xs text-slate-400 mt-1">{errorMsg || 'Assessment not found.'}</p>
        </div>
        <button
          onClick={() => navigate('/requests')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
        >
          Return to Requests
        </button>
      </div>
    );
  }

  const { test, team, candidate, teamLead, role } = testData;

  // 1. PRE-TEST INSTRUCTIONS GATE
  if (phase === 'gate') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-orange-500 selection:text-white">
        <header className="p-5 border-b border-slate-800 flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">CampusCollab Secure Assessment</h1>
              <p className="text-xs text-slate-400">Proctored Coding Screening &bull; Team: {team?.title || 'Project'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/requests')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
        </header>

        <main className="max-w-3xl mx-auto w-full p-6 space-y-6">
          <div className="p-6 sm:p-8 rounded-[32px] bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-black uppercase tracking-wider">
                Technical Screening Challenge
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{test.title}</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Assigned by Team Lead <strong className="text-white">{teamLead?.name || 'Lead'}</strong> for your application as <strong className="text-orange-400">{role || 'Team Member'}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Duration</span>
                <p className="font-extrabold text-white text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-400" /> {test.timeLimitMinutes} Minutes
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Environment</span>
                <p className="font-extrabold text-white text-sm flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-blue-400" /> Monaco VS Code
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Language</span>
                <p className="font-extrabold text-white text-sm uppercase flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" /> {test.language}
                </p>
              </div>
            </div>

            {/* Anti-Cheat Rules Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Secure Window & Anti-Cheat Protocols</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li><strong>Mandatory Fullscreen:</strong> The assessment requires full screen. Exiting fullscreen logs a violation.</li>
                <li><strong>Tab / App Switching Monitored:</strong> Navigating away from this tab (opening external VS Code, Discord, or search tabs) is recorded in real time.</li>
                <li><strong>Copy/Paste Restricted:</strong> Pasting code from external sources is tracked.</li>
                <li><strong>3-Strike Policy:</strong> Reaching 3 violation strikes will immediately auto-terminate and submit your assessment.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartTest}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Maximize2 className="w-4 h-4" /> Enter Fullscreen & Start Assessment
              </button>
            </div>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-slate-600 border-t border-slate-900">
          CampusCollab Secure Proctored Environment &bull; All activity is logged and audited for the Team Lead.
        </footer>
      </div>
    );
  }

  // 2. POST-TEST SUBMITTED SUMMARY
  if (phase === 'submitted') {
    const isTerminated = test.status === 'terminated_violations' || strikes >= 3;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
        <header className="p-5 border-b border-slate-800 flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Assessment Submission Status</h1>
              <p className="text-xs text-slate-400">Team: {team?.title || 'Project'}</p>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto w-full p-6">
          <div className="p-8 rounded-[32px] bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-6">
            {isTerminated ? (
              <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">
                {isTerminated ? 'Assessment Terminated with Violations' : 'Assessment Successfully Submitted!'}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isTerminated
                  ? 'Your assessment was auto-submitted due to reaching 3 policy violations (tab-switches or window blurs). The audit report has been logged for the Team Lead.'
                  : 'Your solution, execution outputs, and integrity logs have been submitted to Team Lead ' + (teamLead?.name || 'the team lead') + ' for review.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-left">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Time Taken</span>
                <p className="font-extrabold text-white text-sm">{Math.floor(timeSpentSeconds / 60)}m {timeSpentSeconds % 60}s</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Violation Strikes</span>
                <p className={`font-extrabold text-sm ${strikes > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {strikes} / 3 Strikes
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Audit Status</span>
                <p className={`font-extrabold text-sm ${strikes === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {strikes === 0 ? 'Clean Integrity' : 'Violations Logged'}
                </p>
              </div>
            </div>

            {violationLogs.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/30 text-left space-y-2">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">Security Audit Events:</span>
                <ul className="text-[11px] text-slate-300 font-mono space-y-1 list-disc list-inside">
                  {violationLogs.map((v, i) => (
                    <li key={i}>
                      <span className="text-slate-500">{new Date(v.timestamp).toLocaleTimeString()}:</span> {v.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => navigate('/requests')}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Return to Requests Dashboard
            </button>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-slate-600">
          CampusCollab Secure Assessments
        </footer>
      </div>
    );
  }

  // 3. ACTIVE LIVE CODING WORKSPACE
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Violation Alert Modal (if user triggered strike 1 or 2) */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full p-5 sm:p-6 rounded-3xl bg-slate-900 border-2 border-red-500 shadow-2xl text-center space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
              <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-black uppercase">
                Security Warning: Strike {activeWarning.strike} of {activeWarning.maxStrikes}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-2">Violation Detected</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{activeWarning.message}</p>
            </div>
            <p className="text-[11px] text-red-400 font-semibold bg-red-950/40 p-2.5 rounded-xl border border-red-500/20">
              ⚠️ If you reach 3 strikes, your test will immediately terminate and submit. Stay inside this window in Fullscreen mode.
            </p>
            <button
              onClick={() => {
                setActiveWarning(null);
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all cursor-pointer shadow-lg"
            >
              I Understand - Resume Fullscreen Test
            </button>
          </div>
        </div>
      )}

      {/* Top Proctored Header */}
      <header className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 shrink-0">
        
        {/* Left: Problem & Mode */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 shrink-0">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">{test.title}</h1>
            <p className="text-[10px] text-slate-400 truncate">
              Candidate: <strong className="text-slate-200">{candidate?.name || 'You'}</strong> &bull; Team: <strong className="text-orange-400">{team?.title}</strong>
            </p>
          </div>
        </div>

        {/* Center: Live Countdown Timer */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className={`px-2.5 sm:px-3 py-1 rounded-xl border flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-black shadow-md ${
            timeLeftSeconds < 300
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
              : 'bg-slate-950 text-orange-400 border-slate-800'
          }`}>
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>
        </div>

        {/* Right: Anti-Cheat Telemetry & Submit Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto sm:ml-0">
          {/* Strike Counter */}
          <div className={`px-2 py-1 rounded-xl border text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shrink-0 ${
            strikes === 0
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : strikes === 1
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
          }`}>
            <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Violations: </span>
            <span>{strikes}/3</span>
          </div>

          {/* Fullscreen indicator */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            {isFullscreen ? (
              <span className="text-emerald-400 flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Fullscreen</span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1"><Minimize2 className="w-3 h-3" /> Exited Fullscreen</span>
            )}
          </div>

          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1 sm:gap-1.5 border border-slate-700 cursor-pointer transition-all active:scale-95"
            title="Run and test your code in console"
          >
            <Play className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run Code'}</span>
            <span className="sm:hidden">{isRunning ? '...' : 'Run'}</span>
          </button>

          {/* Submit Test Button */}
          <button
            onClick={() => handleSubmitTest(false)}
            disabled={submitting}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-slate-950 font-black text-xs flex items-center gap-1 sm:gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{submitting ? 'Submitting...' : 'Submit Assessment'}</span>
            <span className="sm:hidden">{submitting ? '...' : 'Submit'}</span>
          </button>
        </div>
      </header>

      {/* Mobile / Tablet Segmented Tab Switcher (< md screens) */}
      <div className="flex md:hidden bg-slate-900 border-b border-slate-800 p-1.5 gap-1 shrink-0 z-20">
        <button
          type="button"
          onClick={() => setMobileTab('problem')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'problem'
              ? 'bg-orange-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Problem</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'editor'
              ? 'bg-orange-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('console')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'console'
              ? 'bg-orange-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Console</span>
          {output && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
        </button>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Panel: Problem Statement & Instructions */}
        <div className={`w-full md:w-2/5 border-r border-slate-800 bg-slate-900/40 flex-col overflow-y-auto ${
          mobileTab === 'problem' ? 'flex flex-1 h-full' : 'hidden md:flex'
        }`}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Problem Instructions
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Language: {test.language}
              </span>
            </div>

            <div className="prose prose-invert prose-xs text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {test.description}
            </div>

            {/* Sample Test Cases Panel */}
            {test.testCases && test.testCases.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sample Test Cases ({test.testCases.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click to run against code</span>
                </div>

                <div className="space-y-2">
                  {test.testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-[11px]">Case #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setStdin(tc.input || '');
                            setShowStdin(true);
                            handleRunCodeWithInput(tc.input || '', tc.expectedOutput || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] font-bold border border-orange-500/40 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Run This Case
                        </button>
                      </div>

                      <div className="space-y-1.5 font-mono text-[11px]">
                        {tc.input && (
                          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 text-[10px] block font-sans font-semibold">Input / Arguments:</span>
                            <span className="text-white whitespace-pre-wrap">{tc.input}</span>
                          </div>
                        )}
                        {tc.expectedOutput && (
                          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 text-[10px] block font-sans font-semibold">Expected Output:</span>
                            <span className="text-emerald-300 whitespace-pre-wrap">{tc.expectedOutput}</span>
                          </div>
                        )}
                        {tc.explanation && (
                          <div className="text-[10px] text-slate-400 font-sans italic">
                            Explanation: {tc.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anti-cheat live log for transparency */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Anti-Cheat Activity Radar</span>
                <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1">
                <p className="text-slate-500">&gt; Window blur tracker active</p>
                <p className="text-slate-500">&gt; Fullscreen integrity active</p>
                {violationLogs.map((log, i) => (
                  <p key={i} className="text-red-400">
                    &gt; [STRIKE {i + 1}] {log.description}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Monaco Editor + Output Console */}
        <div className={`w-full md:w-3/5 flex-col bg-[#1e1e1e] ${
          mobileTab !== 'problem' ? 'flex flex-1 h-full' : 'hidden md:flex'
        }`}>
          
          {/* In-Browser Monaco Editor (VS Code Experience) */}
          <div className={`flex-1 relative ${mobileTab === 'console' ? 'hidden md:block' : 'block'}`}>
            <Editor
              height="100%"
              language={
                ['c', 'cpp', 'c++', 'python', 'javascript', 'typescript'].includes((test.language || '').toLowerCase())
                  ? (test.language === 'c++' ? 'cpp' : (test.language || '').toLowerCase())
                  : 'javascript'
              }
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 13,
                fontFamily: "Fira Code, Consolas, 'Courier New', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                cursorBlinking: 'smooth',
                lineNumbers: 'on',
              }}
            />
          </div>

          {/* Bottom Execution Output Console & Optional STDIN */}
          <div className={`border-t border-slate-800 bg-slate-950 flex flex-col shrink-0 ${
            mobileTab === 'console'
              ? 'flex-1 h-full'
              : mobileTab === 'editor'
              ? 'hidden md:flex h-52'
              : 'h-52'
          }`}>
            <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-bold">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-orange-400" /> Output Console
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                  {test.language || 'Code'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStdin(!showStdin)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    showStdin
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Provide custom standard input for scanf, cin, or input()"
                >
                  {showStdin ? 'Hide STDIN Input' : '+ Custom STDIN (Input)'}
                </button>
                <button
                  type="button"
                  onClick={() => setOutput('')}
                  className="text-[10px] hover:text-white cursor-pointer px-1.5 py-0.5 rounded text-slate-400"
                >
                  Clear Console
                </button>
              </div>
            </div>

            {showStdin && (
              <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-orange-400 whitespace-nowrap">STDIN:</span>
                <input
                  type="text"
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter inputs for scanf(), cin >>, or input() separated by space/newlines..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>
            )}

            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-emerald-400 whitespace-pre-wrap select-text">
              {output || `// Click "Run Code" above to compile & run your ${test.language || 'code'} with real output...`}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default SecureCodingTest;
