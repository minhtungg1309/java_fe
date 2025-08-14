/**
 * Cấu hình chung cho ứng dụng
 */
export const CONFIG = {
  API: "http://localhost:8080/api",
  SOCKET: "http://localhost:8099",
} as const;

/**
 * Các endpoint API được sử dụng trong ứng dụng
 */
export const API = {
  // Quản lý người dùng
  CREATE_USER: "/users",
  GET_USERS: "/users",
  UPDATE_USER: "/users/{userId}",
  DELETE_USER: "/users/{userId}",
  MY_INFO: "/my-info",
  SEARCH_USER: "/users/search",
  
  // Xác thực
  LOGIN: "/auth/token",
  
  // Quản lý quyền
  CREATE_PERMISSION: "/permissions",
  GET_PERMISSIONS: "/permissions",
  DELETE_PERMISSION: "/permissions/{permission}",
  
  // Quản lý vai trò
  CREATE_ROLE: "/roles",
  GET_ROLES: "/roles",
  DELETE_ROLE: "/roles/{roleName}",

  // Quản lý cuộc trò chuyện
  CONVERSATIONS_MY: "/conversations/my-conversations",
  CONVERSATIONS_CREATE: "/conversations/create",

  // Quản lý tin nhắn
  MESSAGES_GET: "/messages",
  MESSAGES_CREATE: "/messages/create",
} as const;
  