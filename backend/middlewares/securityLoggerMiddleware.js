const SecurityLog = require('../models/securityLogModel');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Helper to sanitize payload (remove sensitive secrets while preserving attack signatures)
const sanitizePayload = (body) => {
  if (!body || typeof body !== 'object') return '';
  try {
    const clone = { ...body };
    if (clone.password) clone.password = '***REDACTED***';
    if (clone.newPassword) clone.newPassword = '***REDACTED***';
    if (clone.token) clone.token = '***REDACTED***';
    return JSON.stringify(clone).slice(0, 500);
  } catch {
    return '';
  }
};

// Helper to extract clean IP address
const getClientIp = (req) => {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  } else if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  return ip;
};

// Helper to parse browser, OS, and device type from User-Agent
const parseUserAgent = (uaString = '') => {
  const ua = uaString.toLowerCase();
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'Desktop';

  // Device
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua)) {
    deviceType = /tablet|ipad/.test(ua) ? 'Tablet' : 'Mobile';
  } else if (/curl|python|sqlmap|nmap|nikto|postman|bot|crawler|spider/.test(ua)) {
    deviceType = 'Automated Tool / Bot';
  }

  // OS
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('kali')) os = 'Kali Linux (Security Tool)';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Browser / Client
  if (ua.includes('sqlmap')) browser = 'sqlmap (Exploit Tool)';
  else if (ua.includes('nikto')) browser = 'Nikto Scanner';
  else if (ua.includes('nmap')) browser = 'Nmap Scripting Engine';
  else if (ua.includes('dirbuster') || ua.includes('gobuster')) browser = 'Directory Brute-Forcer';
  else if (ua.includes('postman')) browser = 'Postman Runtime';
  else if (ua.includes('curl')) browser = 'cURL CLI';
  else if (ua.includes('python-requests')) browser = 'Python Requests Library';
  else if (ua.includes('edg')) browser = 'Microsoft Edge';
  else if (ua.includes('chrome')) browser = 'Google Chrome';
  else if (ua.includes('firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Apple Safari';

  return { browser, os, deviceType };
};

// Security Inspection Engine
const inspectRequest = (req) => {
  const indicators = [];
  let threatLevel = 'Normal';
  let attackType = 'None';

  const fullUrl = (req.originalUrl || req.url || '').toLowerCase();
  const rawUA = (req.headers['user-agent'] || '').toLowerCase();
  const queryStr = JSON.stringify(req.query || {}).toLowerCase();
  const bodyStr = JSON.stringify(req.body || {}).toLowerCase();
  const allPayloads = `${fullUrl} ${queryStr} ${bodyStr}`;

  // 1. Automated Attacker Scanner / Pentest Tool Detection
  if (/sqlmap|nikto|dirbuster|gobuster|wpscan|hydra|metasploit|nmap|masscan/.test(rawUA)) {
    threatLevel = 'Critical';
    attackType = 'Automated Scanner / Malicious Bot';
    indicators.push(`Offensive security testing tool signature detected in User-Agent: "${req.headers['user-agent']}"`);
  }

  // 2. SQL & NoSQL Injection Detection
  const sqlPatterns = [
    /'\s*or\s*['"0-9]/i,
    /union\s+all\s+select/i,
    /union\s+select/i,
    /;\s*drop\s+table/i,
    /;\s*delete\s+from/i,
    /--\s*$/,
    /\$where/i,
    /\$regex/i,
    /\$ne/i,
    /\$gt/i,
    /information_schema/i,
  ];
  for (const pattern of sqlPatterns) {
    if (pattern.test(allPayloads)) {
      threatLevel = 'Critical';
      attackType = 'SQL / NoSQL Injection';
      indicators.push(`Detected SQL/NoSQL Injection signature matching pattern: ${pattern}`);
      break;
    }
  }

  // 3. Cross-Site Scripting (XSS) Injection Detection
  const xssPatterns = [
    /<script[\s\S]*?>/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /<svg\/onload/i,
    /<img[^>]+onerror/i,
    /alert\s*\(/i,
    /document\.cookie/i,
    /eval\s*\(/i,
  ];
  for (const pattern of xssPatterns) {
    if (pattern.test(allPayloads)) {
      if (threatLevel !== 'Critical') threatLevel = 'High';
      attackType = 'XSS Injection Attempt';
      indicators.push(`Detected Cross-Site Scripting (XSS) payload signature matching: ${pattern}`);
      break;
    }
  }

  // 4. Path Traversal & Local File Inclusion (LFI)
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /\/etc\/passwd/i,
    /\/etc\/shadow/i,
    /c:\\windows/i,
    /win\.ini/i,
    /boot\.ini/i,
  ];
  for (const pattern of pathTraversalPatterns) {
    if (pattern.test(allPayloads)) {
      threatLevel = 'Critical';
      attackType = 'Path Traversal Attack';
      indicators.push(`Detected Path Traversal / File Inclusion attack signature matching: ${pattern}`);
      break;
    }
  }

  // 5. Unauthorized Admin Endpoint Probing
  if (fullUrl.includes('/api/admin') && !req.headers.authorization && !req.headers.cookie) {
    if (threatLevel === 'Normal') {
      threatLevel = 'High';
      attackType = 'Unauthorized Admin Access';
      indicators.push('Probing privileged /api/admin/* endpoint without security authorization credentials or token');
    }
  }

  // 6. Suspicious Header Manipulation
  if (req.headers['x-forwarded-host'] && req.headers['x-forwarded-host'] !== req.headers.host) {
    indicators.push(`Host header mismatch: Client requested "${req.headers['x-forwarded-host']}" vs Host "${req.headers.host}"`);
    if (threatLevel === 'Normal') threatLevel = 'Low';
  }

  return { threatLevel, attackType, indicators };
};

// The Middleware function
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  const initialInspection = inspectRequest(req);

  res.on('finish', async () => {
    try {
      const responseTimeMs = Date.now() - startTime;
      const ipAddress = getClientIp(req);
      const { browser, os, deviceType } = parseUserAgent(req.headers['user-agent']);
      const isBlocked = res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429;

      let threatLevel = initialInspection.threatLevel;
      let attackType = initialInspection.attackType;
      const suspiciousIndicators = [...initialInspection.indicators];

      // If response is 401/403 on admin routes
      if ((req.originalUrl || '').includes('/api/admin') && (res.statusCode === 401 || res.statusCode === 403)) {
        threatLevel = threatLevel === 'Critical' ? 'Critical' : 'High';
        if (attackType === 'None') attackType = 'Unauthorized Admin Access';
        suspiciousIndicators.push(`Admin request rejected by security policy with status ${res.statusCode}`);
      }

      // If failed login attempts
      if ((req.originalUrl || '').includes('/api/auth/login') && res.statusCode === 400) {
        if (threatLevel === 'Normal') threatLevel = 'Medium';
        if (attackType === 'None') attackType = 'Failed Authentication / Brute Force';
        suspiciousIndicators.push('Failed student/admin login attempt with invalid credentials');
      }

      // If server 500 error on unusual payload
      if (res.statusCode >= 500 && threatLevel !== 'Normal') {
        suspiciousIndicators.push(`Server threw unhandled 500 exception while processing suspicious input payload`);
      }

      // Extract real user info if authenticated
      let userEmail = 'Guest (Not logged in)';
      let userRole = 'guest';
      let userId = null;

      if (req.user?.email) {
        userEmail = req.user.email;
        userRole = req.user.role || 'user';
        userId = req.user._id || null;
      } else {
        // Check authorization header or cookie token to identify logged-in user
        const authHeader = req.headers.authorization;
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        } else if (req.headers.cookie) {
          const rawCookies = req.headers.cookie.split(';');
          for (let c of rawCookies) {
            const [k, v] = c.trim().split('=');
            if (k === 'token') {
              token = v;
              break;
            }
          }
        }

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campuscollab_jwt_secret_key_30min_session');
            if (decoded?.id) {
              const dbUser = await User.findById(decoded.id).select('email role');
              if (dbUser) {
                userEmail = dbUser.email;
                userRole = dbUser.role || 'user';
                userId = dbUser._id;
              }
            }
          } catch {
            // Ignore token verification errors here
          }
        }

        // If not logged in but submitted email in login/registration body
        if (userEmail === 'Guest (Not logged in)' && req.body?.email && typeof req.body.email === 'string') {
          userEmail = req.body.email;
        }
      }

      // Extract sanitized headers
      const requestHeaders = {
        host: req.headers.host || '',
        origin: req.headers.origin || '',
        referer: req.headers.referer || '',
        hasAuthToken: Boolean(req.headers.authorization || req.headers.cookie),
        contentType: req.headers['content-type'] || '',
        acceptLanguage: req.headers['accept-language'] || '',
      };

      await SecurityLog.create({
        ipAddress,
        method: req.method,
        endpoint: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTimeMs,
        threatLevel,
        attackType,
        userAgent: req.headers['user-agent'] || 'Unknown',
        browser,
        os,
        deviceType,
        userId,
        userEmail,
        userRole,
        requestHeaders,
        queryParams: req.query || {},
        requestPayloadSnippet: sanitizePayload(req.body),
        suspiciousIndicators,
        isBlocked,
        originHost: req.headers.host || '',
      });
    } catch (err) {
      // Never crash the application on telemetry logging
      console.error('SecurityLogger error recording log:', err.message);
    }
  });

  next();
};

module.exports = {
  securityLogger,
  seedRealisticSecurityLogs: async () => {},
  getClientIp,
  parseUserAgent,
  inspectRequest,
};
