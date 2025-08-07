import { getToken, removeToken, setToken } from "./localStorageService";
import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { LoginRequest, LoginResponse } from "../types/auth";
import { handleApiError } from "../utils/apiHelpers";

/**
 * Service xử lý authentication
 */
export class AuthenticationService {
  /**
   * Đăng nhập user
   * @param username - Tên đăng nhập
   * @param password - Mật khẩu
   * @returns Response từ API
   */
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await httpClient.post<LoginResponse>(API.LOGIN, {
        username,
        password,
      } as LoginRequest);

      // Lưu token vào localStorage
      if (response.data?.result?.token) {
        setToken(response.data.result.token);
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Đăng nhập thất bại');
    }
  }

  /**
   * Đăng xuất user
   */
  static logout(): void {
    removeToken();
  }

  /**
   * Kiểm tra user đã đăng nhập chưa
   * @returns Token nếu đã đăng nhập, null nếu chưa
   */
  static isAuthenticated(): string | null {
    return getToken();
  }

  /**
   * Lấy token hiện tại
   * @returns Token hiện tại
   */
  static getCurrentToken(): string | null {
    return getToken();
  }
}

// Export các function để tương thích ngược
export const logIn = AuthenticationService.login;
export const logOut = AuthenticationService.logout;
export const isAuthenticated = AuthenticationService.isAuthenticated;
