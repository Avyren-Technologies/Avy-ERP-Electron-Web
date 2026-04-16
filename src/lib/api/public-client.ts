import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://avy-erp-api.avyren.in/api/v1/';

export const publicApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});
