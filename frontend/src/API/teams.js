const BASE_URL = '/api/teams';

export const getTeams = async () => {
  const res = await fetch(BASE_URL, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const createNewTeam = async (teamData) => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(teamData),
  });
  return res.json();
};

export const invitePeerToTeam = async (teamId, recipientId, message = '', role = '') => {
  const res = await fetch(`${BASE_URL}/${teamId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ recipientId, message, role }),
  });
  return res.json();
};

export const cancelTeamInvite = async (teamId, recipientId) => {
  const res = await fetch(`${BASE_URL}/${teamId}/invite/${recipientId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const requestToJoinTeam = async (teamId, message = '', role = '') => {
  const res = await fetch(`${BASE_URL}/${teamId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, role }),
  });
  return res.json();
};

export const cancelJoinRequest = async (teamId) => {
  const res = await fetch(`${BASE_URL}/${teamId}/join`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const removeTeamMember = async (teamId, memberId) => {
  const res = await fetch(`${BASE_URL}/${teamId}/members/${memberId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const addTeamTask = async (teamId, taskData) => {
  const res = await fetch(`${BASE_URL}/${teamId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(taskData),
  });
  return res.json();
};

export const updateTeamTask = async (teamId, taskId, updates) => {
  const res = await fetch(`${BASE_URL}/${teamId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  return res.json();
};

export const deleteTeamTask = async (teamId, taskId) => {
  const res = await fetch(`${BASE_URL}/${teamId}/tasks/${taskId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const getTeamMessages = async (teamId) => {
  const res = await fetch(`${BASE_URL}/${teamId}/messages`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const sendTeamMessage = async (teamId, messageData) => {
  const isFormData = messageData instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  const body = isFormData ? messageData : JSON.stringify(messageData);

  const res = await fetch(`${BASE_URL}/${teamId}/messages`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body,
  });
  return res.json();
};

export const uploadChatFile = async (teamId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/${teamId}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res.json();
};

