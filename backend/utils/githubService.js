/**
 * GitHub Service for Live Sync
 * Fetches public profile stats and repositories via the GitHub REST API (No auth token required).
 */

const extractGithubUsername = (input) => {
  if (!input) return '';
  let str = input.trim();
  // Strip trailing slashes
  str = str.replace(/\/+$/, '');
  // Extract username if URL is provided
  const match = str.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  // Strip leading @
  return str.replace(/^@/, '').trim();
};

// In-memory cache for GitHub user data (TTL: 10 minutes)
const gitHubCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const fetchGitHubData = async (rawInput) => {
  const username = extractGithubUsername(rawInput);
  if (!username) {
    throw new Error('Valid GitHub username or profile URL is required');
  }

  const cacheKey = username.toLowerCase();
  const cached = gitHubCache.get(cacheKey);
  const now = Date.now();

  // Return fresh cached data if within TTL
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const headers = {
    'User-Agent': 'CampusCare-Collaboration-Platform',
    'Accept': 'application/vnd.github.v3+json',
  };

  // Optional: If GITHUB_TOKEN is configured in .env, boost rate limit from 60 to 5,000 req/hr
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
  }

  // 1. Fetch user profile
  let userRes;
  try {
    userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  } catch (netErr) {
    if (cached) return cached.data;
    throw netErr;
  }

  if (!userRes.ok) {
    // If rate limited but we have older cached data, return cached data gracefully
    if ((userRes.status === 403 || userRes.status === 429) && cached) {
      return cached.data;
    }

    const error = new Error(
      userRes.status === 404
        ? `GitHub user "${username}" was not found.`
        : userRes.status === 403 || userRes.status === 429
        ? 'GitHub API rate limit exceeded (60 requests/hour for unauthenticated IP). Please configure a GITHUB_TOKEN in backend/.env or wait a few minutes.'
        : `GitHub API error: ${userRes.statusText}`
    );
    error.statusCode = userRes.status || 400;
    throw error;
  }
  const userData = await userRes.json();

  // 2. Fetch public repositories sorted by recently updated (up to 15)
  const reposRes = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=15&type=public`,
    { headers }
  );

  let rawRepos = [];
  if (reposRes.ok) {
    rawRepos = await reposRes.json();
  }

  let totalStars = 0;
  let totalForks = 0;
  const languageCounts = {};

  const repositories = (Array.isArray(rawRepos) ? rawRepos : []).map((repo) => {
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const lang = repo.language || 'Code';

    totalStars += stars;
    totalForks += forks;

    if (repo.language) {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    }

    return {
      name: repo.name,
      language: lang,
      description: repo.description || '',
      url: repo.html_url,
      stars,
      forks,
      updatedAt: repo.updated_at,
    };
  });

  // Calculate top languages
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  const githubStats = {
    username: userData.login,
    avatarUrl: userData.avatar_url || '',
    publicRepos: userData.public_repos || repositories.length,
    followers: userData.followers || 0,
    following: userData.following || 0,
    totalStars,
    totalForks,
    topLanguages,
    streakUrl: `https://github-readme-streak-stats.herokuapp.com/?user=${encodeURIComponent(userData.login)}&theme=radical&hide_border=true`,
    lastSynced: new Date(),
  };

  const result = {
    username: userData.login,
    githubUrl: userData.html_url,
    githubStats,
    repositories,
  };

  gitHubCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
};

module.exports = {
  extractGithubUsername,
  fetchGitHubData,
};
