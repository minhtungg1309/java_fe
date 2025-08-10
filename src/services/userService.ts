import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { User, CreateUserRequest, UpdateUserRequest } from "../types/user";
import { handleApiResponse, createUrl, handleApiError } from "../utils/apiHelpers";

/**
 * Service xử lý user operations
 */
export class UserService {
  /**
   * Tạo user mới
   * @param user - Thông tin user cần tạo
   * @returns User đã được tạo
   */
  static async create(user: CreateUserRequest): Promise<User> {
    try {
      const response = await httpClient.post(API.CREATE_USER, user);
      return handleApiResponse<User>(response);
    } catch (error) {
      throw handleApiError(error, 'Không thể tạo user');
    }
  }

  /**
   * Lấy danh sách tất cả users
   * @returns Danh sách users
   */
  static async getAll(): Promise<User[]> {
    try {
      const response = await httpClient.get(API.GET_USERS);
      return handleApiResponse<User[]>(response);
    } catch (error) {
      throw handleApiError(error, 'Không thể lấy danh sách users');
    }
  }

  /**
   * Cập nhật thông tin user
   * @param id - ID của user cần cập nhật
   * @param user - Thông tin cần cập nhật
   * @returns User đã được cập nhật
   */
  static async update(id: string | number, user: Partial<UpdateUserRequest>): Promise<User> {
    try {
      const url = createUrl(API.UPDATE_USER, { userId: id });
      const response = await httpClient.put(url, user);
      return handleApiResponse<User>(response);
    } catch (error) {
      throw handleApiError(error, 'Không thể cập nhật user');
    }
  }

  /**
   * Xóa user
   * @param id - ID của user cần xóa
   */
  static async delete(id: string | number): Promise<void> {
    try {
      const url = createUrl(API.DELETE_USER, { userId: id });
      await httpClient.delete(url);
    } catch (error) {
      throw handleApiError(error, 'Không thể xóa user');
    }
  }

  /**
   * Lấy thông tin user hiện tại
   * @returns Thông tin user đang đăng nhập
   */
  static async getMyInfo(): Promise<User> {
    try {
      const response = await httpClient.get(API.MY_INFO);
      return handleApiResponse<User>(response);
    } catch (error) {
      throw handleApiError(error, 'Không thể lấy thông tin user');
    }
  }
}

// Export các function để tương thích ngược
export const createUser = UserService.create;
export const getUsers = UserService.getAll;
export const updateUser = UserService.update;
export const deleteUser = UserService.delete;
export const getMyInfo = UserService.getMyInfo;