const BASE_URL = '/api/admin';

export const getAdminStats = async () => {
  const res = await fetch(`${BASE_URL}/stats`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const getAllCandidates = async () => {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const deleteCandidate = async (id) => {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const getAllRequestsAdmin = async () => {
  const res = await fetch(`${BASE_URL}/requests`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const deleteRequestAdmin = async (id) => {
  const res = await fetch(`${BASE_URL}/requests/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const getAllInquiriesAdmin = async () => {
  const res = await fetch(`${BASE_URL}/inquiries`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const deleteInquiryAdmin = async (id) => {
  const res = await fetch(`${BASE_URL}/inquiries/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const getAllTeamsAdmin = async () => {
  const res = await fetch(`${BASE_URL}/teams`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const deleteTeamAdmin = async (id) => {
  const res = await fetch(`${BASE_URL}/teams/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const getUserLogsAdmin = async () => {
  const res = await fetch(`${BASE_URL}/user-logs`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const getSecurityLogsAdmin = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/security-logs${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const simulateTestAttackAdmin = async (attackVariant = 'sqli') => {
  const res = await fetch(`${BASE_URL}/security-logs/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ attackVariant }),
  });
  return res.json();
};

export const clearSecurityLogsAdmin = async () => {
  const res = await fetch(`${BASE_URL}/security-logs/clear`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const getAllQuestionsAdmin = async () => {
  const res = await fetch(`${BASE_URL}/questions`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const createQuestionAdmin = async (payload) => {
  const res = await fetch(`${BASE_URL}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const updateQuestionAdmin = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const deleteQuestionAdmin = async (id) => {
  const res = await fetch(`${BASE_URL}/questions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};



