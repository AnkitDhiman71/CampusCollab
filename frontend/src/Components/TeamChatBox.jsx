import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Code,
  Image as ImageIcon,
  Video,
  X,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
  Users,
  Shield,
  Clock,
  Lock
} from 'lucide-react';
import { getTeamMessages, sendTeamMessage, uploadChatFile } from '../API/teams';
import { aiExplainCode } from '../API/peers';

export function TeamChatBox({ team, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [inputText, setInputText] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Deduplicated member count
  const memberCount = React.useMemo(() => {
    const ids = new Set();
    const leadId = (team?.lead?._id || team?.lead)?.toString();
    if (leadId) ids.add(leadId);
    (team?.members || []).forEach((m) => {
      const id = (m?._id || m)?.toString();
      if (id) ids.add(id);
    });
    return ids.size || (team?.members?.length || 1);
  }, [team]);
  
  // Code snippet toggle state
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState({ code: '', language: 'javascript' });
  const [copiedId, setCopiedId] = useState(null);

  // AI Code Explanation state
  const [explanations, setExplanations] = useState({});
  const [explainingId, setExplainingId] = useState(null);

  const handleExplainCode = async (msgId, code, language) => {
    if (explanations[msgId]) {
      setExplanations((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
      return;
    }

    setExplainingId(msgId);
    try {
      const res = await aiExplainCode({ code, language: language || 'javascript' });
      if (res?.success && res.explanation) {
        setExplanations((prev) => ({
          ...prev,
          [msgId]: res.explanation,
        }));
      } else {
        alert(res?.message || 'Could not explain code.');
      }
    } catch (err) {
      console.error('AI code explanation error:', err);
      alert('Failed to connect to AI explanation service.');
    } finally {
      setExplainingId(null);
    }
  };

  // File/Photo attachment state
  const [attachment, setAttachment] = useState(null); // { url, name, fileType, size, isUploading }
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await getTeamMessages(team._id || team.id);
      if (res?.success) {
        setMessages(res.messages || []);
        setAuthError('');
        if (isInitial) {
          setTimeout(scrollToBottom, 150);
        }
      } else if (res?.message) {
        setAuthError(res.message);
      }
    } catch (err) {
      console.error('Failed to load team messages:', err);
      if (err?.response?.data?.message) {
        setAuthError(err.response.data.message);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);

    // Live polling every 3.5 seconds
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3500);

    return () => clearInterval(interval);
  }, [team._id || team.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Handle local photo/file selection with Multer upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25MB limit.');
      return;
    }

    const isImg = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    // Local instant preview while uploading
    const localPreview = isImg ? URL.createObjectURL(file) : '';
    setAttachment({
      url: localPreview,
      name: file.name,
      fileType: isImg ? 'image' : (isPdf ? 'pdf' : 'document'),
      size: sizeStr,
      isUploading: true,
    });

    try {
      setUploadingFile(true);
      const res = await uploadChatFile(team._id || team.id, file);
      if (res?.success && res.attachment) {
        setAttachment({
          url: res.attachment.url,
          name: res.attachment.name,
          fileType: res.attachment.fileType,
          size: res.attachment.size,
          isUploading: false,
        });
      } else {
        alert(res?.message || 'Failed to upload file.');
        setAttachment(null);
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error uploading file to server.');
      setAttachment(null);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (uploadingFile || attachment?.isUploading) {
      alert('Please wait for the file to finish uploading before sending.');
      return;
    }

    const hasText = inputText.trim().length > 0;
    const hasCode = codeSnippet.code.trim().length > 0;
    const hasAtt = !!attachment && !!attachment.url;

    if (!hasText && !hasCode && !hasAtt) return;

    setSending(true);

    const payload = {
      text: inputText.trim(),
      codeSnippet: hasCode ? codeSnippet : undefined,
      attachment: hasAtt
        ? {
            url: attachment.url,
            name: attachment.name,
            fileType: attachment.fileType,
            size: attachment.size,
          }
        : undefined,
    };

    // Optimistic message update
    const optimisticMsg = {
      _id: `temp_${Date.now()}`,
      sender: {
        _id: currentUser?._id,
        name: currentUser?.name || 'You',
        department: currentUser?.department || 'Student',
      },
      text: payload.text,
      codeSnippet: payload.codeSnippet,
      attachment: payload.attachment,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setCodeSnippet({ code: '', language: 'javascript' });
    setShowCodeInput(false);
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const res = await sendTeamMessage(team._id || team.id, payload);
      if (res?.success) {
        // Replace temp message with server response
        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticMsg._id ? res.message : m))
        );
      }
    } catch {
      alert('Failed to send message. Please retry.');
    } finally {
      setSending(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const copyCodeToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[650px] max-h-[82vh] rounded-[32px] glass-panel shadow-2xl relative overflow-hidden border border-white/80 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
      
      {/* 1. CHAT HEADER */}
      <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 bg-white/40 dark:bg-white/5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/25 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {team.title}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                Team Chat
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{memberCount} {memberCount === 1 ? 'collaborator' : 'collaborators'} in room</span>
              <span>&bull;</span>
              <span>Only accessible by this team</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Launch Video Standup */}
          <a
            href={`https://meet.jit.si/CampusCollab_${(team.title || 'team').replace(/[^a-zA-Z0-9]/g, '_')}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-sky-400 dark:hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Start live video call standup"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Video Sync</span>
          </a>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl glass-tile text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Close chat box"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MESSAGES STREAM CONTAINER */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scroll-smooth"
      >
        {authError ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Restricted Team Channel
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              {authError}
            </p>
          </div>
        ) : loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-sky-400" />
            <p className="text-xs font-semibold">Connecting to secure team channel...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-slate-400 dark:text-slate-500 p-6">
            <div className="w-12 h-12 rounded-2xl glass-tile flex items-center justify-center mb-1 text-blue-600 dark:text-sky-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-slate-700 dark:text-slate-300">
              Welcome to the {team.title} Channel!
            </h4>
            <p className="text-xs max-w-sm leading-relaxed">
              This space is strictly private for your team members. Share design mockups, code snippets, photos, and project files.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === currentUser?._id;
            const isLead = (team.lead?._id || team.lead) === msg.sender?._id;

            return (
              <div
                key={msg._id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Sender Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/10'
                  }`}
                  title={`${msg.sender?.name} (${msg.sender?.department || 'Student'})`}
                >
                  {msg.sender?.name ? msg.sender.name[0] : '?'}
                </div>

                <div className={`space-y-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Metadata Bar */}
                  <div
                    className={`flex items-center gap-1.5 text-[10px] font-bold ${
                      isMe ? 'justify-end' : 'justify-start'
                    } text-slate-500 dark:text-slate-400`}
                  >
                    <span>{isMe ? 'You' : msg.sender?.name || 'Teammate'}</span>
                    {isLead && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        Lead
                      </span>
                    )}
                    <span>&bull;</span>
                    <span className="font-medium text-[9px]">{formatTime(msg.createdAt)}</span>
                  </div>

                  {/* Main Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl space-y-2.5 text-xs shadow-md leading-relaxed ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'glass-tile text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200/60 dark:border-white/10'
                    }`}
                  >
                    {/* Text content */}
                    {msg.text && (
                      <p className="whitespace-pre-wrap font-medium text-xs sm:text-sm">
                        {msg.text}
                      </p>
                    )}

                    {/* Photo / Image Attachment */}
                    {Boolean(msg.attachment?.url && msg.attachment.fileType === 'image') && (
                      <div className="rounded-xl overflow-hidden border border-white/20 mt-1 max-w-sm">
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.name || 'Shared Photo'}
                          className="w-full max-h-64 object-cover hover:scale-[1.01] transition-transform cursor-pointer"
                          onClick={() => window.open(msg.attachment.url, '_blank')}
                        />
                        <div className="p-2 bg-black/40 text-[10px] text-white flex items-center justify-between">
                          <span className="truncate max-w-[180px] font-semibold">{msg.attachment.name}</span>
                          <a
                            href={msg.attachment.url}
                            download={msg.attachment.name || 'photo.png'}
                            className="hover:underline flex items-center gap-1 font-bold text-sky-300"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Document / File Attachment */}
                    {Boolean(msg.attachment?.url && msg.attachment.fileType !== 'image') && (
                      <div className="p-2.5 rounded-xl bg-white/15 dark:bg-black/20 border border-white/20 flex items-center justify-between gap-3 mt-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{msg.attachment.name}</p>
                            <span className="text-[10px] opacity-75">{msg.attachment.size}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={msg.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Open / View File in browser"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open</span>
                          </a>
                          <a
                            href={msg.attachment.url}
                            download={msg.attachment.name || 'file'}
                            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Download File"
                          >
                            <Download className="w-3 h-3" />
                            <span>Get</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Formatted Code Snippet Block */}
                    {msg.codeSnippet && msg.codeSnippet.code && (
                      <div className="rounded-xl overflow-hidden bg-slate-950 text-slate-100 border border-slate-800 text-left font-mono mt-1">
                        <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] font-sans">
                          <span className="text-amber-400 font-bold uppercase tracking-wider">
                            {msg.codeSnippet.language || 'Code'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExplainCode(msg._id, msg.codeSnippet.code, msg.codeSnippet.language)}
                              disabled={explainingId === msg._id}
                              className="px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm disabled:opacity-60 text-[10px]"
                              title="Get an AI explanation of this code"
                            >
                              {explainingId === msg._id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Explaining...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-amber-300" />
                                  <span>{explanations[msg._id] ? 'Hide Explanation' : 'Explain Code'}</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => copyCodeToClipboard(msg.codeSnippet.code, msg._id)}
                              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedId === msg._id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <pre className="p-3 text-[11px] overflow-x-auto leading-relaxed">
                          <code>{msg.codeSnippet.code}</code>
                        </pre>

                        {/* AI Explanation Drawer */}
                        {explanations[msg._id] && (
                          <div className="p-3.5 bg-slate-900/95 border-t border-blue-500/40 text-slate-200 text-xs font-sans space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Gemini AI Code Explanation</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleExplainCode(msg._id)}
                                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                                title="Dismiss explanation"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed font-normal">
                              {explanations[msg._id]}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. ATTACHMENT PREVIEW DRAWER (If photo/file selected) */}
      {attachment && (
        <div className="px-4 py-2.5 bg-blue-50/90 dark:bg-blue-950/60 border-t border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between gap-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            {attachment.fileType === 'image' && attachment.url ? (
              <img src={attachment.url} alt="Preview" className="w-9 h-9 rounded-xl object-cover shrink-0 border border-blue-300 dark:border-blue-700 shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-500/25">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate">{attachment.name}</p>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{attachment.size}</span>
                <span>&bull;</span>
                {attachment.isUploading ? (
                  <span className="text-blue-600 dark:text-sky-400 font-bold flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading with Multer...
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Ready to send</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAttachment(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. CODE SNIPPET INPUT DRAWER (If </> toggled) */}
      {showCodeInput && (
        <div className="p-3 bg-slate-900 text-slate-100 border-t border-slate-800 space-y-2 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-sky-400 flex items-center gap-1">
              <Code className="w-3.5 h-3.5" /> Share Code Snippet
            </span>
            <div className="flex items-center gap-2">
              <select
                value={codeSnippet.language}
                onChange={(e) => setCodeSnippet({ ...codeSnippet, language: e.target.value })}
                className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200 outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML / CSS</option>
                <option value="cpp">C++</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash / Terminal</option>
              </select>

              <button
                type="button"
                onClick={() => setShowCodeInput(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            value={codeSnippet.code}
            onChange={(e) => setCodeSnippet({ ...codeSnippet, code: e.target.value })}
            placeholder="// Paste your code block here..."
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      )}

      {/* 5. INPUT FORM BAR */}
      {authError ? (
        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>You must be an accepted collaborator to send messages or share files.</span>
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 border-t border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl flex items-center gap-2 shrink-0"
        >
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.zip,.txt,.json,.js,.py,.cpp"
            className="hidden"
          />

          {/* Attach File/Photo Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl glass-tile text-slate-500 hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer shrink-0"
            title="Share photo or document file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Code Snippet Button */}
          <button
            type="button"
            onClick={() => setShowCodeInput(!showCodeInput)}
            className={`p-2.5 rounded-2xl transition-colors cursor-pointer shrink-0 ${
              showCodeInput
                ? 'bg-blue-600 text-white'
                : 'glass-tile text-slate-500 hover:text-blue-600 dark:hover:text-sky-400'
            }`}
            title="Share code snippet"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${team.title} channel...`}
            className="flex-1 px-4 py-2.5 glass-input-field rounded-2xl text-xs sm:text-sm font-medium transition-all"
          />

          {/* Submit Send Button */}
          <button
            type="submit"
            disabled={sending || uploadingFile || attachment?.isUploading || (!inputText.trim() && !codeSnippet.code.trim() && !attachment)}
            className="px-4 sm:px-5 py-2.5 rounded-2xl glass-btn-cta text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-40 shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : uploadingFile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
}

export default TeamChatBox;
