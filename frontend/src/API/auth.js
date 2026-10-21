const BASE_URL = '/api/auth';

export const sendOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const verifyOtp = async (email, otp) => {
  const res = await fetch(`${BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return res.json();
};

export const signupUser = async (formData) => {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(formData),
  });
  return res.json();
};

export const loginUser = async (credentials) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  return res.json();
};

export const logoutUser = async () => {
  const res = await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
};

export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const updateUserProfile = async (profileData) => {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(profileData),
  });
  return res.json();
};
