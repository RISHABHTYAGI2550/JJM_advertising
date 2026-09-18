import axios from 'axios';

const PRODUCTION_BACKEND_URL = 'https://jjm-advertising.onrender.com';

const BACKEND_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'))
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : PRODUCTION_BACKEND_URL);

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
});

export const getBackendBaseUrl = () => BACKEND_URL;
