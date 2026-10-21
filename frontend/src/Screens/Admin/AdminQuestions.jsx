import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../Components/AdminNavbar';
import { Code2, Plus, Trash2, Edit3, Search, Clock, Tag, CheckCircle2, AlertTriangle, Loader2, X, Copy, Check, ChevronDown, ChevronUp, FileCode, Sparkles } from 'lucide-react';
import { getAllQuestionsAdmin, createQuestionAdmin, updateQuestionAdmin, deleteQuestionAdmin } from '../../API/admin';

export function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Modal states (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    category: 'General',
    difficulty: 'Medium',
    language: 'javascript',
    duration: 30,
    description: '',
    starterCode: '',
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await getAllQuestionsAdmin();
      if (res?.success) {
        setQuestions(res.questions || []);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
      setMsg({ type: 'error', text: 'Failed to fetch assessment questions from database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormError('');
    setFormData({
      name: '',
      title: '',
      category: 'General',
      difficulty: 'Medium',
      language: 'javascript',
      duration: 30,
      description: '',
      starterCode: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (q) => {
    setEditingId(q._id);
    setFormError('');
    setFormData({
      name: q.name || '',
      title: q.title || '',
      category: q.category || 'General',
      difficulty: q.difficulty || 'Medium',
      language: q.language || 'javascript',
      duration: q.duration || 30,
      description: q.description || '',
      starterCode: q.starterCode || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.title.trim() || !formData.description.trim()) {
      setFormError('Please fill out the preset name, challenge title, and problem description.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingId) {
        const res = await updateQuestionAdmin(editingId, formData);
        if (res?.success) {
          setMsg({ type: 'success', text: 'Question updated in database successfully!' });
          setTimeout(() => setMsg({ type: '', text: '' }), 4000);
          setIsModalOpen(false);
          fetchQuestions();
        } else {
          setFormError(res?.message || 'Failed to update question.');
        }
      } else {
        const res = await createQuestionAdmin(formData);
        if (res?.success) {
          setMsg({ type: 'success', text: 'New question saved to database successfully!' });
          setTimeout(() => setMsg({ type: '', text: '' }), 4000);
          setIsModalOpen(false);
          fetchQuestions();
        } else {
          setFormError(res?.message || 'Failed to create question.');
        }
      }
    } catch (err) {
      console.error('Save question error:', err);
      setFormError('Network error while saving question to database.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete the question "${title}" from the database?`)) {
      return;
    }

    try {
      const res = await deleteQuestionAdmin(id);
      if (res?.success) {
        setQuestions((prev) => prev.filter((q) => q._id !== id));
        setMsg({ type: 'success', text: `Question "${title}" deleted from database.` });
        setTimeout(() => setMsg({ type: '', text: '' }), 4000);
      } else {
        alert(res?.message || 'Failed to delete question.');
      }
    } catch {
      alert('Error deleting question from database.');
    }
  };

  const handleCopyCode = (id, code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQuestions = questions.filter((q) => {
    const term = search.toLowerCase().trim();
    const matchSearch =
      !term ||
      q.name?.toLowerCase().includes(term) ||
      q.title?.toLowerCase().includes(term) ||
      q.category?.toLowerCase().includes(term) ||
      q.description?.toLowerCase().includes(term);

    const matchLang = languageFilter === 'all' || q.language === languageFilter;
    const matchDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;

    return matchSearch && matchLang && matchDiff;
  });

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Hard':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  const getLanguageLabel = (lang) => {
    switch (lang) {
      case 'python':
        return 'Python 3';
      case 'cpp':
        return 'C++';
      case 'c':
        return 'C (GCC)';
      case 'typescript':
        return 'TypeScript';
      default:
        return 'JavaScript';
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-sky-400 text-xs font-bold mb-2">
              <Code2 className="w-4 h-4" />
              <span>Assessment Management</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Technical Assessment Questions
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Store, manage, and create coding assessment questions stored directly in the MongoDB database
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold text-blue-600 dark:text-sky-400">
              Total Questions: {questions.length}
            </span>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Question</span>
            </button>
          </div>
        </div>

        {/* Success or Error alert banner */}
        {msg.text && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 backdrop-blur-md transition-all ${
              msg.type === 'error'
                ? 'bg-red-500/20 border border-red-500/40 text-red-200'
                : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
            }`}
          >
            {msg.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-200/60 dark:border-white/10 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions by title, category, keyword..."
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input-field text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Language Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
                {['all', 'javascript', 'python', 'cpp', 'c', 'typescript'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguageFilter(lang)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] capitalize transition-all cursor-pointer ${
                      languageFilter === lang
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'all' ? 'All Languages' : lang === 'cpp' ? 'C++' : lang === 'c' ? 'C' : lang}
                  </button>
                ))}
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
                {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      difficultyFilter === diff
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {diff === 'all' ? 'All Difficulties' : diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Loading questions from database...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="glass-panel p-12 rounded-[32px] text-center space-y-4 border border-slate-200/60 dark:border-white/10 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FileCode className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No questions found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {search || languageFilter !== 'all' || difficultyFilter !== 'all'
                ? 'No questions matched your current search and filter criteria. Try adjusting your filters.'
                : 'There are currently no coding questions stored in the database. Click "+ Add New Question" to create one.'}
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Question</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedId === q._id;
              return (
                <div
                  key={q._id}
                  className="glass-panel p-5 sm:p-6 rounded-[24px] border border-slate-200/60 dark:border-white/10 shadow-xl hover:border-blue-500/30 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/25 font-bold">
                          {q.category || 'General'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyBadge(
                            q.difficulty
                          )}`}
                        >
                          {q.difficulty || 'Medium'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 uppercase">
                          {getLanguageLabel(q.language)}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{q.duration || 30} mins</span>
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {q.title}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-amber-300 font-semibold">
                        Preset Label: <span className="text-slate-700 dark:text-slate-300">{q.name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => openEditModal(q)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                        title="Edit Question"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(q._id, q.title)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-1 cursor-pointer transition-all"
                        title="Delete Question from DB"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Toggle details section */}
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q._id)}
                      className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Details & Starter Code</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>View Problem Statement & Starter Code</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                        {/* Problem Statement */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Problem Statement & Instructions
                          </label>
                          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                            {q.description}
                          </div>
                        </div>

                        {/* Starter Code */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5 text-blue-500" />
                              <span>Starter Code Template</span>
                            </label>
                            {q.starterCode && (
                              <button
                                onClick={() => handleCopyCode(q._id, q.starterCode)}
                                className="text-[11px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === q._id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Template</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
                            {q.starterCode || '// No starter code provided'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add or Edit Question */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
            <div className="w-full max-w-2xl max-h-[92vh] glass-panel p-6 sm:p-7 rounded-[32px] border border-blue-500/40 shadow-2xl flex flex-col space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-500 dark:text-sky-400 flex items-center justify-center shadow-md">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingId ? 'Edit Assessment Question' : 'Add New Question to Database'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-white/70">
                      {editingId
                        ? 'Update question details, instructions, or starter code'
                        : 'Define a new technical coding challenge to be stored in the DB'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-white/70 dark:hover:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Preset Name & Challenge Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-white/90">
                      Preset / Button Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Algorithm: Binary Search"
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-white/50">
                      Short label displayed on the 1-click preset bar
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-white/90">
                      Challenge Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Efficient Binary Search in Rotated Array"
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-white/50">Full title of the test</p>
                  </div>
                </div>

                {/* Category, Difficulty, Language, Duration */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-white/90">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Algorithms"
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-white/90">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-white/90">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => {
                        const lang = e.target.value;
                        let starter = formData.starterCode;
                        if (lang === 'c' && (!starter || starter.includes('function') || starter.includes('def '))) {
                          starter = `#include <stdio.h>\n#include <string.h>\n\nvoid solve() {\n    printf("Running C Solution...\\n");\n}\n\nint main() {\n    solve();\n    return 0;\n}\n`;
                        } else if (lang === 'cpp' && (!starter || starter.includes('function') || starter.includes('def '))) {
                          starter = `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Running C++ Solution..." << endl;\n    return 0;\n}\n`;
                        }
                        setFormData({ ...formData, language: lang, starterCode: starter });
                      }}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python 3</option>
                      <option value="cpp">C++</option>
                      <option value="c">C (GCC)</option>
                      <option value="typescript">TypeScript</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-white/90">Time Limit</label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="w-full rounded-xl glass-input-field px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value={15}>15 mins</option>
                      <option value={20}>20 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                      <option value={90}>90 mins</option>
                    </select>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-white/90">
                    Problem Statement & Test Instructions *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe problem specifications, inputs, outputs, time complexities, and sample test cases..."
                    className="w-full rounded-xl glass-input-field p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Starter Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-white/90">
                    Starter Code Template (Optional)
                  </label>
                  <textarea
                    rows={6}
                    value={formData.starterCode}
                    onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                    placeholder={`function solution() {\n  // Starter template code...\n}\n`}
                    className="w-full rounded-xl glass-input-field p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingId ? 'Update Question' : 'Save Question to DB'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminQuestions;
