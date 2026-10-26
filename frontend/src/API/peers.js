const BASE_URL = '/api/peers';

export const getPeers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.department && filters.department !== 'All') params.append('department', filters.department);
  if (filters.skill && filters.skill !== 'All') params.append('skill', filters.skill);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${BASE_URL}${queryStr}`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};
export const sendCollaborationRequest = async (recipientId, message, fileUrl = '', fileName = '', role = '') => {
  const res = await fetch(`${BASE_URL}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ recipientId, message, fileUrl, fileName, role }),
  });
  return res.json();
};

export const getMyRequests = async () => {
  const res = await fetch(`${BASE_URL}/requests`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};
export const updateRequestStatus = async (id, status) => {
  const res = await fetch(`${BASE_URL}/requests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const getPeerProfile = async (peerId) => {
  const res = await fetch(`${BASE_URL}/profile/${peerId}`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const requestPeerInteraction = async (requestId, payload = {}) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/interaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const deleteRequest = async (id) => {
  const res = await fetch(`${BASE_URL}/requests/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const getLiveGitHubData = async (username) => {
  const cleanUser = encodeURIComponent(username.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '').replace(/^@/, ''));
  const res = await fetch(`${BASE_URL}/github/${cleanUser}`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const assignTechnicalTest = async (requestId, payload = {}) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/test/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getTechnicalTest = async (requestId) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/test`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const startTechnicalTest = async (requestId) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/test/start`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
};

export const submitTechnicalTest = async (requestId, payload = {}) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/test/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const reviewTechnicalTest = async (requestId, payload = {}) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/test/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getAssessmentQuestions = async () => {
  const res = await fetch(`${BASE_URL}/questions`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const aiExplainCode = async (payload) => {
  const res = await fetch(`${BASE_URL}/ai/explain-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const aiEvaluateAssessment = async (requestId) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/test/ai-evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return res.json();
};

export const aiGenerateTestCases = async (payload) => {
  const res = await fetch(`${BASE_URL}/ai/generate-test-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const executeCodeApi = async ({ code, language, stdin = '' }) => {
  const res = await fetch(`${BASE_URL}/execute-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code, language, stdin }),
  });
  return res.json();
};

export const markInteractionCompleted = async (requestId) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/interaction/complete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return res.json();
};

export const allowCandidateToJoin = async (requestId, allow = true) => {
  const res = await fetch(`${BASE_URL}/requests/${requestId}/allow-join`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ allow }),
  });
  return res.json();
};







