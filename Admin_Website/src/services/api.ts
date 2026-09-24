import axios from 'axios';

export const PRODUCTION_BACKEND_URL =
  (import.meta as any).env?.VITE_API_URL || 'https://jjm-advertising.onrender.com';

export const getActiveBackendUrl = (): string => {
  // Production Cloud Server is the authoritative backend
  return PRODUCTION_BACKEND_URL;
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
