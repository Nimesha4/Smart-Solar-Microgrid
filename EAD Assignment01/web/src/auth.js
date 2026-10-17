import axios from 'axios';

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getToken = () => localStorage.getItem('token');

export const setAuthSession = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  if (token) {
    localStorage.setItem('token', token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  localStorage.removeItem('token');
  delete axios.defaults.headers.common.Authorization;
};

export const clearAuthSession = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  delete axios.defaults.headers.common.Authorization;
};

export const getDefaultRouteForRole = (role) => {
  if (role === 'Backoffice') return '/backoffice';
  if (role === 'GridOperator') return '/operator';
  if (role === 'Prosumer') return '/prosumer';
  return '/login';
};

export const userHasRole = (role) => {
  const user = getStoredUser();
  return Boolean(user && user.role === role);
};

export const isAuthenticated = () => Boolean(getStoredUser() && getToken());
