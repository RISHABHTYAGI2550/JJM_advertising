import axios from 'axios';

const PRODUCTION_BACKEND_URL = 'https://jjm-advertising.onrender.com';

export const getActiveBackendUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('jjm_backend_target');
    if (saved === 'local') {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    if (saved && saved.startsWith('http')) {
      return saved;
    }
    // If URL has ?backend=local
    if (new URLSearchParams(window.location.search).get('backend') === 'local') {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
  }
  // Default to live production backend so Admin Web and TV screens are always in sync!
  return (import.meta as any).env?.VITE_API_URL || PRODUCTION_BACKEND_URL;
};

export const api = axios.create({
  baseURL: `${getActiveBackendUrl()}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  config.baseURL = `${getActiveBackendUrl()}/api`;
  return config;
});

export const getBackendBaseUrl = () => getActiveBackendUrl();

export const setBackendTarget = (target: 'live' | 'local') => {
  if (typeof window !== 'undefined') {
    if (target === 'local') {
      localStorage.setItem('jjm_backend_target', 'local');
    } else {
      localStorage.removeItem('jjm_backend_target');
    }
    window.location.reload();
  }
};
