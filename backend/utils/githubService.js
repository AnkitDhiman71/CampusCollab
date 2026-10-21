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

const fetchGitHubData = async (rawInput) => {
  const username = extractGithubUsername(rawInput);
  if (!username) {
    throw new Error('Valid GitHub username or profile URL is required');
  }

  const headers = {
    'User-Agent': 'CampusCare-Collaboration-Platform',
    'Accept': 'application/vnd.github.v3+json',
  };

  // 1. Fetch user profile
  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  if (!userRes.ok) {
    const error = new Error(
      userRes.status === 404
        ? `GitHub user "${username}" was not found.`
        : userRes.status === 403
        ? 'GitHub API rate limit reached. Please try again in a few minutes.'
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

  return {
    username: userData.login,
    githubUrl: userData.html_url,
    githubStats,
    repositories,
  };
};

module.exports = {
  extractGithubUsername,
  fetchGitHubData,
};
