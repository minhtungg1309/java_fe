/**
 * Kiểu dữ liệu cho login request
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Kiểu dữ liệu cho login response
 */
export interface LoginResponse {
  result: {
    token: string;
    role: string;
    authenticated: boolean;
  };
}
