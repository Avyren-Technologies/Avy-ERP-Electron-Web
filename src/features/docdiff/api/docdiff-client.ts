import axios from "axios";

const DOCDIFF_API_URL =
  import.meta.env.VITE_DOCDIFF_API_URL || "http://localhost:8000/api/v1";

export const docdiffClient = axios.create({
  baseURL: DOCDIFF_API_URL,
  timeout: 120_000,
  headers: { Accept: "application/json" },
});

docdiffClient.interceptors.request.use((config) => {
  try {
    const tokensRaw = localStorage.getItem("auth_tokens");
    if (tokensRaw) {
      const tokens = JSON.parse(tokensRaw) as { accessToken?: string };
      if (tokens.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
    }
  } catch {
    /* ignore */
  }
  return config;
});

docdiffClient.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    const axiosError = error as {
      response?: { data?: { error?: string; detail?: string } };
      message?: string;
    };
    const message =
      axiosError.response?.data?.error ||
      axiosError.response?.data?.detail ||
      axiosError.message;
    return Promise.reject(new Error(message));
  },
);

export { DOCDIFF_API_URL };
