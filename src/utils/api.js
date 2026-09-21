import axios from "axios";
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl !== "undefined" && !envUrl.startsWith("/")) {
    return envUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("staging")) {
      return "https://staging-api.elaaschool.org";
    }
    if (host.includes("elaaschool.org")) {
      return "https://api.elaaschool.org";
    }
  }
  return "http://localhost:5000";
};

const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config.url && (
        error.config.url.includes("/auth/login") || 
        error.config.url.includes("/superadmin/login")
      );
      if (!isLoginRequest) {
        console.warn("Session expired or invalid token. Logging out...");
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
