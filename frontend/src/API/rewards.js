const BASE_URL = '/api/rewards';

export const sendTeamReward = async ({ teamId, recipientId, amount, reason, utrNumber }) => {
  try {
    const res = await fetch(`${BASE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ teamId, recipientId, amount, reason, utrNumber }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message || 'Failed to record reward.' };
  }
};

export const getTeamRewards = async (teamId) => {
  try {
    const res = await fetch(`${BASE_URL}/team/${teamId}`, {
      method: 'GET',
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return { success: false, rewards: [] };
  }
};

export const getMyRewards = async () => {
  try {
    const res = await fetch(`${BASE_URL}/my`, {
      method: 'GET',
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return { success: false, rewards: [], totalReceived: 0 };
  }
};
