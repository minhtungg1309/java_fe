import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { Role, CreateRoleRequest } from "../types/role";
import {
  handleApiResponse,
  createUrl,
  handleApiError,
} from "../utils/apiHelpers";

/**
 * Service xử lý role operations
 */
export class RoleService {
  /**
   * Tạo role mới
   * @param role - Thông tin role cần tạo
   * @returns Role đã được tạo
   */
  static async create(role: CreateRoleRequest): Promise<Role> {
    try {
      const response = await httpClient.post(API.CREATE_ROLE, role);
      return handleApiResponse<Role>(response);
    } catch (error) {
      throw handleApiError(error, "Không thể tạo role");
    }
  }

  /**
   * Lấy danh sách tất cả roles
   * @returns Danh sách roles
   */
  static async getAll(): Promise<Role[]> {
    try {
      const response = await httpClient.get(API.GET_ROLES);
      return handleApiResponse<Role[]>(response);
    } catch (error) {
      throw handleApiError(error, "Không thể lấy danh sách roles");
    }
  }

  /**
   * Xóa role
   * @param roleName - Tên role cần xóa
   */
  static async delete(roleName: string): Promise<void> {
    try {
      const url = createUrl(API.DELETE_ROLE, { roleName });
      await httpClient.delete(url);
    } catch (error) {
      throw handleApiError(error, "Không thể xóa role");
    }
  }
}

// Export các function để tương thích ngược
export const createRole = RoleService.create;
export const getRoles = RoleService.getAll;
export const deleteRole = RoleService.delete;
