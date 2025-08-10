import axios from "axios";
import { CONFIG } from "./configuration";
import { getToken, removeToken } from "../services/localStorageService";

const httpClient = axios.create({
  baseURL: CONFIG.API,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - tự động thêm token vào headers
httpClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý khi token hết hạn
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      removeToken();
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
