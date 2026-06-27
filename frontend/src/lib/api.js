import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nexar_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  signup: (data) => api.post("/auth/signup", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const nexar = {
  analyze: (query, category = "auto") => api.post("/analyze", { query, category }).then((r) => r.data),
  reports: () => api.get("/reports").then((r) => r.data),
  report: (id) => api.get(`/reports/${id}`).then((r) => r.data),
  bookmark: (id) => api.post(`/reports/${id}/bookmark`).then((r) => r.data),
  trendingScams: () => api.get("/trending/scams").then((r) => r.data),
  trendingProducts: () => api.get("/trending/products").then((r) => r.data),
  stats: () => api.get("/stats").then((r) => r.data),
  chat: (message, session_id) => api.post("/chat", { message, session_id }).then((r) => r.data),
  translate: (text, target_lang = "hi") => api.post("/translate", { text, target_lang }).then((r) => r.data),
  postReview: (data) => api.post("/community/reviews", data).then((r) => r.data),
  reviews: (rid) => api.get(`/community/reviews/${rid}`).then((r) => r.data),
  reportScam: (data) => api.post("/community/scams", data).then((r) => r.data),
  adminOverview: () => api.get("/admin/overview").then((r) => r.data),
};
