const BASE_URL = '/api/notifications';

export const getMyNotifications = async () => {
  const res = await fetch(BASE_URL, {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
};

export const markNotificationAsRead = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}/read`, {
    method: 'PUT',
    credentials: 'include',
  });
  return res.json();
};

export const markAllNotificationsAsRead = async () => {
  const res = await fetch(`${BASE_URL}/mark-all-read`, {
    method: 'PUT',
    credentials: 'include',
  });
  return res.json();
};

export const deleteNotification = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};
