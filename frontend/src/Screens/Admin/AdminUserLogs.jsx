import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../Components/AdminNavbar';
import { ShieldAlert, ShieldCheck, Search, Download, Copy, Check, Clock, Calendar, AlertTriangle, Loader2, RefreshCw, Eye, X, Code, Radio, Server, Globe, Monitor, Trash2, AlertOctagon, CheckCircle2, Ban, User, Mail, Lock, Smartphone, Laptop, LayoutGrid, LayoutList } from 'lucide-react';
import { getSecurityLogsAdmin, simulateTestAttackAdmin, clearSecurityLogsAdmin } from '../../API/admin';

export function AdminUserLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    criticalThreats: 0,
    highThreats: 0,
    blockedCount: 0,
    uniqueAttackerIpsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState('ALL');
  const [attackFilter, setAttackFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeRange, setTimeRange] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (threatFilter !== 'ALL') params.threatLevel = threatFilter;
      if (attackFilter !== 'ALL') params.attackType = attackFilter;
      if (statusFilter !== 'ALL') params.statusCode = statusFilter;
      if (timeRange !== 'ALL') params.timeRange = timeRange;

      const res = await getSecurityLogsAdmin(params);
      if (res?.success) {
        setLogs(res.logs || []);
        if (res.stats) setStats(res.stats);
      } else {
        setErrorMsg(res?.message || 'Failed to retrieve security logs.');
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
      setErrorMsg('Network error while loading security logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [threatFilter, attackFilter, statusFilter, timeRange]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const copyToClipboard = (text, fieldId) => {
    if (!text) return;
    navigator.clipboard.writeText(text.toString());
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSimulateAttack = async (variant) => {
    setSimulating(true);
    try {
      const res = await simulateTestAttackAdmin(variant);
      if (res?.success) {
        setActionNotice(`Simulated ${variant.toUpperCase()} test attack recorded! IP and user details captured below.`);
        setTimeout(() => setActionNotice(''), 5000);
        fetchLogs();
      } else {
        alert(res?.message || 'Simulation failed.');
      }
    } catch {
      alert('Error triggering test attack simulation.');
    } finally {
      setSimulating(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all security logs?')) return;
    try {
      const res = await clearSecurityLogsAdmin();
      if (res?.success) {
        setActionNotice('All security logs cleared.');
        setTimeout(() => setActionNotice(''), 4000);
        fetchLogs();
      }
    } catch {
      alert('Failed to clear logs.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `security_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getThreatBadge = (level) => {
    switch (level) {
      case 'Critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 shadow-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>CRITICAL ATTACK</span>
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>HIGH THREAT</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>SUSPICIOUS</span>
          </span>
        );
      case 'Low':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>NOTICE</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>SAFE / NORMAL</span>
          </span>
        );
    }
  };

  const getStatusBadge = (code) => {
    if (code >= 200 && code < 300) return <span className="font-mono text-emerald-400 font-bold">{code} OK</span>;
    if (code === 401) return <span className="font-mono text-amber-400 font-extrabold">{code} Unauthorized</span>;
    if (code === 403) return <span className="font-mono text-red-400 font-extrabold">{code} Blocked</span>;
    if (code === 404) return <span className="font-mono text-slate-400 font-semibold">{code} Not Found</span>;
    if (code >= 500) return <span className="font-mono text-purple-400 font-black">{code} Server Error</span>;
    return <span className="font-mono text-slate-300">{code}</span>;
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'POST': return <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-black text-[10px]">POST</span>;
      case 'GET': return <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-black text-[10px]">GET</span>;
      case 'PUT': return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-black text-[10px]">PUT</span>;
      case 'DELETE': return <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-black text-[10px]">DELETE</span>;
      default: return <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono font-bold text-[10px]">{method}</span>;
    }
  };

  const renderUserEmail = (email) => {
    if (!email || email.includes('Guest') || email.includes('Not Logged In') || email.includes('Anonymous') || email === 'Unknown') {
      return (
        <span className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Guest (Not logged in)</span>
        </span>
      );
    }
    return (
      <span className="text-blue-400 font-bold flex items-center gap-1.5 text-xs" title={email}>
        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="truncate">{email}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between glass-canvas text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-red-500 selection:text-white font-sans">
      <div 
        className="fixed -top-12 -left-12 w-[34rem] h-[34rem] rounded-full blur-[140px] pointer-events-none z-0 transition-all duration-500" 
        style={{ background: 'var(--orb-1)' }}
      />
      <div 
        className="fixed top-1/3 -right-12 w-[44rem] h-[44rem] rounded-full blur-[160px] pointer-events-none z-0 transition-all duration-500" 
        style={{ background: 'var(--orb-2)' }}
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <AdminNavbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-[32px] glass-panel border border-red-500/25 bg-gradient-to-br from-white/95 via-slate-50/90 to-red-50/40 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-red-950/20 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                <span>Security & Attacker Detection Logs</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:white tracking-tight flex items-center gap-3">
                <span>User & Attacker Activity Logs</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Monitor everyone who visits the platform. Inspect their <strong className="text-slate-900 dark:text-slate-200">IP address</strong>, <strong className="text-slate-900 dark:text-slate-200">logged-in user email</strong>, <strong className="text-slate-900 dark:text-slate-200">page visited</strong>, and any attacks detected (such as SQL injection, scripts, or unauthorized admin probes).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-2">Test Attack:</span>
                <button
                  disabled={simulating}
                  onClick={() => handleSimulateAttack('sqli')}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer border border-red-500/30"
                  title="Test how SQL injection looks in the log"
                >
                  + SQL Injection
                </button>
                <button
                  disabled={simulating}
                  onClick={() => handleSimulateAttack('xss')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer border border-amber-500/30"
                  title="Test how Script (XSS) attack looks in the log"
                >
                  + XSS Attack
                </button>
                <button
                  disabled={simulating}
                  onClick={() => handleSimulateAttack('probe')}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer border border-purple-500/30"
                  title="Test unauthorized admin page access"
                >
                  + Admin Probe
                </button>
              </div>
              <button
                onClick={fetchLogs}
                className="px-3.5 py-2 rounded-2xl glass-btn-ghost text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3.5 py-2 rounded-2xl glass-btn-cta text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                title="Download security logs as a JSON file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Logs</span>
              </button>
              <button
                onClick={handleClearLogs}
                className="p-2 rounded-2xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 cursor-pointer"
                title="Delete all logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {actionNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Requests</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalLogs}</h3>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/10 shadow-md flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">Attacks Detected</p>
                <h3 className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">
                  {stats.criticalThreats + stats.highThreats}
                </h3>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 shadow-md flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Unique Attacker IPs</p>
                <h3 className="text-xl font-black text-amber-600 dark:text-amber-300 mt-0.5 font-mono">
                  {stats.uniqueAttackerIpsCount}
                </h3>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Blocked Requests</p>
                <h3 className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{stats.blockedCount}</h3>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by IP address (e.g. 185.220), User Email, Page URL, or Attack Type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer shadow-sm"
              >
                Search Logs
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={threatFilter}
                  onChange={(e) => setThreatFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value="ALL">All Threat Levels</option>
                  <option value="Critical">🔴 Critical Attacks</option>
                  <option value="High">🟠 High Threats</option>
                  <option value="Medium">🟡 Suspicious</option>
                  <option value="Low">🔵 Notice / Low</option>
                  <option value="Normal">🟢 Normal / Safe</option>
                </select>

                <select
                  value={attackFilter}
                  onChange={(e) => setAttackFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl font-bold text-slate-300 outline-none cursor-pointer"
                >
                  <option value="ALL">All Attack Types</option>
                  <option value="SQL / NoSQL Injection">SQL Injection</option>
                  <option value="Unauthorized Admin Access">Unauthorized Admin Access</option>
                  <option value="XSS Injection Attempt">XSS Script Attack</option>
                  <option value="Path Traversal Attack">File Path Attack (Path Traversal)</option>
                  <option value="Automated Scanner / Malicious Bot">Automated Bot / Scanner</option>
                  <option value="Failed Authentication / Brute Force">Failed Password / Brute Force</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl font-bold text-slate-300 outline-none cursor-pointer"
                >
                  <option value="ALL">All Status Codes</option>
                  <option value="401">401 Unauthorized</option>
                  <option value="403">403 Blocked</option>
                  <option value="404">404 Not Found</option>
                  <option value="500">500 Server Error</option>
                  <option value="200">200 OK (Success)</option>
                </select>

                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl font-bold text-slate-300 outline-none cursor-pointer"
                >
                  <option value="ALL">All Time</option>
                  <option value="1h">Last 1 Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card View</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 rounded-[32px] glass-panel flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <p className="text-xs font-semibold">Loading security logs & checking IP addresses...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 rounded-[32px] glass-panel text-center space-y-3 text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
              <h3 className="text-base font-bold text-white">No Logs Found</h3>
              <p className="text-xs text-slate-500">
                No matching records. You can click "+ SQL Injection" above to test how attacker detection works!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <span>Showing {logs.length} request logs</span>
                <span className="flex items-center gap-1.5 text-red-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" /> Live Monitoring Active
                </span>
              </div>

              {viewMode === 'table' ? (
                <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-4">Time & Date</th>
                          <th className="py-3.5 px-4">IP Address</th>
                          <th className="py-3.5 px-4">Logged-in User Email</th>
                          <th className="py-3.5 px-4">Page Visited</th>
                          <th className="py-3.5 px-4">Result Status</th>
                          <th className="py-3.5 px-4">Attack Detected</th>
                          <th className="py-3.5 px-4">Threat Level</th>
                          <th className="py-3.5 px-4">Device</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                        {logs.map((log) => {
                          const isThreat = log.threatLevel === 'Critical' || log.threatLevel === 'High';
                          const formattedDate = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A';
                          return (
                            <tr
                              key={log._id}
                              className={`transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-900/80 ${
                                isThreat ? 'bg-red-500/10 dark:bg-red-950/15' : ''
                              }`}
                            >
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {formattedDate}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-300">
                                  <span>{log.ipAddress}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(log.ipAddress, `tbl_ip_${log._id}`)}
                                    className="text-slate-400 hover:text-blue-600 dark:hover:text-white cursor-pointer ml-1"
                                    title="Copy IP Address"
                                  >
                                    {copiedField === `tbl_ip_${log._id}` ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 max-w-[200px] truncate">
                                {renderUserEmail(log.userEmail)}
                              </td>
                              <td className="py-3 px-4 max-w-[220px]">
                                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                  {getMethodBadge(log.method)}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={log.endpoint}>
                                    {log.endpoint}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {getStatusBadge(log.statusCode)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {log.attackType && log.attackType !== 'None' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30">
                                    {log.attackType}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">None</span>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {getThreatBadge(log.threatLevel)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 text-[11px]">
                                <span>{log.deviceType} &bull; {log.browser}</span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedLog(log)}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer border border-blue-500/30"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Details</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => {
                    const isThreat = log.threatLevel === 'Critical' || log.threatLevel === 'High';
                    const isSelected = selectedLog?._id === log._id;
                    const formattedDate = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A';
                    return (
                      <div
                        key={log._id}
                        className={`rounded-2xl p-4 sm:p-5 transition-all border ${
                          isThreat
                            ? 'bg-red-500/10 dark:bg-red-950/20 border-red-500/30 hover:border-red-500/60 shadow-lg'
                            : 'glass-panel bg-white/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-md'
                        } ${isSelected ? 'ring-2 ring-red-500' : ''}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {getThreatBadge(log.threatLevel)}
                            {log.attackType !== 'None' && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30">
                                {log.attackType}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-black/60 border border-slate-300 dark:border-slate-700 font-mono text-xs font-extrabold text-amber-600 dark:text-amber-300">
                              <Globe className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                              <span>IP: {log.ipAddress}</span>
                              <button
                                onClick={() => copyToClipboard(log.ipAddress, `card_ip_${log._id}`)}
                                className="hover:text-blue-600 dark:hover:text-white cursor-pointer ml-1"
                                title="Copy IP Address"
                              >
                                {copiedField === `card_ip_${log._id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              {getMethodBadge(log.method)}
                              <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 truncate max-w-xs sm:max-w-md" title={log.endpoint}>
                                {log.endpoint}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
                            <div className="text-right text-xs">
                              {getStatusBadge(log.statusCode)}
                              <span className="text-slate-500 ml-2 font-mono text-[11px]">({log.responseTimeMs} ms)</span>
                            </div>
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-blue-500/30"
                              title="Open full technical details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs pt-3">
                          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Logged-in User Email</span>
                            <div className="truncate font-semibold">{renderUserEmail(log.userEmail)}</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">User Role</span>
                            <p className="font-extrabold text-slate-900 dark:text-white capitalize">{log.userRole || 'Guest'}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Browser</span>
                            <p className="font-semibold text-slate-900 dark:text-white truncate" title={log.browser}>{log.browser}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Operating System</span>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={log.os}>{log.os}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Device Type</span>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">{log.deviceType}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Time & Date</span>
                            <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate" title={formattedDate}>{formattedDate}</p>
                          </div>
                        </div>

                        {(log.suspiciousIndicators?.length > 0 || log.requestPayloadSnippet) && (
                          <div className="mt-3 p-3 rounded-xl bg-black/60 border border-red-500/20 space-y-1.5 text-xs">
                            {log.suspiciousIndicators?.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block flex items-center gap-1">
                                  <AlertOctagon className="w-3 h-3 text-red-400" />
                                  <span>Why It Was Flagged (Suspicious Reasons):</span>
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-red-200 font-mono text-[11px]">
                                  {log.suspiciousIndicators.map((ind, i) => (
                                    <li key={i}>{ind}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {log.requestPayloadSnippet && (
                              <div className="pt-1 border-t border-slate-800/80">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                  Submitted Form / Code Data:
                                </span>
                                <pre className="font-mono text-[11px] text-amber-300 overflow-x-auto whitespace-pre-wrap mt-0.5 max-h-16">
                                  {log.requestPayloadSnippet}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono truncate">
                          <span className="truncate">Browser Agent: {log.userAgent}</span>
                          <span className="shrink-0 ml-3 font-semibold">
                            {log.isBlocked ? '🚫 Blocked by Security' : '✅ Request Allowed'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-3xl max-h-[92vh] glass-panel p-4 sm:p-7 rounded-2xl sm:rounded-[32px] border border-red-500/30 bg-white/95 dark:bg-slate-900/95 shadow-2xl flex flex-col space-y-5 relative overflow-hidden text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/15 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/40 text-red-500 dark:text-red-400 flex items-center justify-center font-black shadow-md shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>Log Details</span>
                      {getThreatBadge(selectedLog.threatLevel)}
                    </h3>
                    <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                      IP Address: {selectedLog.ipAddress} &bull; Page: {selectedLog.method} {selectedLog.endpoint}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2), 'modal_json')}
                    className="px-2.5 py-1.5 rounded-xl glass-btn-ghost text-xs font-bold flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-700"
                    title="Copy complete raw JSON data"
                  >
                    {copiedField === 'modal_json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'modal_json' ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 flex-1 text-xs font-sans">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> 1. User & IP Address
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">IP Address</span>
                      <div className="flex items-center justify-between font-mono font-black text-amber-600 dark:text-amber-300 text-sm">
                        <span>{selectedLog.ipAddress}</span>
                        <button
                          onClick={() => copyToClipboard(selectedLog.ipAddress, 'modal_ip')}
                          className="hover:text-blue-600 dark:hover:text-white cursor-pointer"
                          title="Copy IP"
                        >
                          {copiedField === 'modal_ip' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Logged-in User Email</span>
                      <div className="truncate font-semibold">{renderUserEmail(selectedLog.userEmail)}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">User Role</span>
                      <p className="font-extrabold text-slate-900 dark:text-white capitalize">{selectedLog.userRole || 'Guest'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" /> 2. Page Visited & Status
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Action (Method)</span>
                      <p className="font-mono font-black text-slate-900 dark:text-white">{selectedLog.method}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Result Status</span>
                      <p>{getStatusBadge(selectedLog.statusCode)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Response Speed</span>
                      <p className="font-mono font-extrabold text-slate-800 dark:text-slate-200">{selectedLog.responseTimeMs} ms</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Was Request Blocked?</span>
                      <p className="font-bold text-xs">
                        {selectedLog.isBlocked ? (
                          <span className="text-red-600 dark:text-red-400 font-black">YES - BLOCKED</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">NO - ALLOWED</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Requested URL / Page</span>
                    <p className="font-mono text-slate-900 dark:text-white text-xs break-all">{selectedLog.endpoint}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5" /> 3. Attack Detection & Reasons
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-500/30 space-y-1">
                      <span className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold block">Attack Detected</span>
                      <p className="font-black text-red-700 dark:text-red-300 text-sm">{selectedLog.attackType}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-500/30 space-y-1">
                      <span className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold block">Threat Level</span>
                      <p className="font-black text-red-600 dark:text-red-400 text-sm uppercase">{selectedLog.threatLevel}</p>
                    </div>
                  </div>
                  {selectedLog.suspiciousIndicators?.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-red-300 dark:border-red-500/30 space-y-1.5">
                      <span className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold block">
                        Why It Was Flagged (Suspicious Reasons):
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-200 font-mono text-[11px]">
                        {selectedLog.suspiciousIndicators.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" /> 4. Device & Browser Information
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Browser</span>
                      <p className="font-extrabold text-slate-900 dark:text-white truncate">{selectedLog.browser}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Operating System</span>
                      <p className="font-extrabold text-slate-900 dark:text-white truncate">{selectedLog.os}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Device Type</span>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">{selectedLog.deviceType}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Full Browser Details (User-Agent)</span>
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">{selectedLog.userAgent}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" /> 5. Submitted Data & URL Parameters
                  </span>
                  {selectedLog.queryParams && Object.keys(selectedLog.queryParams).length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">URL Query Parameters</span>
                      <pre className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.queryParams, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.requestPayloadSnippet && (
                    <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Submitted Form Data / Payload</span>
                      <pre className="font-mono text-[11px] text-amber-700 dark:text-amber-300 overflow-x-auto whitespace-pre-wrap max-h-32">
                        {selectedLog.requestPayloadSnippet}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-black/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Date & Time</span>
                    <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Log Record ID</span>
                    <p className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{selectedLog._id}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Block Attacker IP:</span>
                  <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-black text-red-600 dark:text-red-300 border border-slate-300 dark:border-slate-700">
                    iptables -A INPUT -s {selectedLog.ipAddress} -j DROP
                  </code>
                  <button
                    onClick={() => copyToClipboard(`iptables -A INPUT -s ${selectedLog.ipAddress} -j DROP`, 'fw_rule')}
                    className="hover:text-blue-600 dark:hover:text-white cursor-pointer ml-1"
                    title="Copy command"
                  >
                    {copiedField === 'fw_rule' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 rounded-xl glass-btn-ghost text-xs font-bold text-slate-800 dark:text-white cursor-pointer w-full sm:w-auto border border-slate-300 dark:border-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUserLogs;
