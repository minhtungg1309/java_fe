/**
 * Cấu hình chung cho ứng dụng
 */
export const CONFIG = {
  API: "http://localhost:8080/api",
  SOCKET: "http://localhost:8099",
} as const;

/**
 * Các endpoint API
 */
export const API = {
  // User APIs
  CREATE_USER: "/users",
  GET_USERS: "/users",
  UPDATE_USER: "/users/{userId}",
  DELETE_USER: "/users/{userId}",
  MY_INFO: "/my-info",
  SEARCH_USER: "/users/search",
  
  // Auth APIs
  LOGIN: "/auth/token",
  
  // Permission APIs
  CREATE_PERMISSION: "/permissions",
  GET_PERMISSIONS: "/permissions",
  DELETE_PERMISSION: "/permissions/{permission}",
  
  // Role APIs
  CREATE_ROLE: "/roles",
  GET_ROLES: "/roles",
  DELETE_ROLE: "/roles/{roleName}",

  // Conversation APIs
  CONVERSATIONS_MY: "/conversations/my-conversations",
  CONVERSATIONS_CREATE: "/conversations/create",

  // Message APIs
  MESSAGES_GET: "/messages",
  MESSAGES_CREATE: "/messages/create",
} as const;
  