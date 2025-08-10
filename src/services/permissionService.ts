import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { Permission, CreatePermissionRequest } from "../types/permission";
import { handleApiResponse, createUrl, handleApiError } from "../utils/apiHelpers";

/**
 * Service xử lý permission operations
 */
export class PermissionService {
  /**
   * Tạo permission mới
   * @param permission - Thông tin permission cần tạo
   * @returns Permission đã được tạo
   */
  static async create(permission: CreatePermissionRequest): Promise<Permission> {
    try {
      const response = await httpClient.post(API.CREATE_PERMISSION, permission);
      return handleApiResponse<Permission>(response);
    } catch (error) {
      throw handleApiError(error, 'Không thể tạo permission');
    }
  }

  /**
   * Lấy danh sách tất cả permissions
   * @returns Danh sách permissions
   */
  static async getAll(): Promise<Permission[]> {
    try {
      const response = await httpClient.get(API.GET_PERMISSIONS);
      return handleApiResponse<Permission[]>(response);
    } catch (error) {
      throw handleApiError(error, 'Không thể lấy danh sách permissions');
    }
  }

  /**
   * Xóa permission
   * @param permissionName - Tên permission cần xóa
   */
  static async delete(permissionName: string): Promise<void> {
    try {
      const url = createUrl(API.DELETE_PERMISSION, { permission: permissionName });
      await httpClient.delete(url);
    } catch (error) {
      throw handleApiError(error, 'Không thể xóa permission');
    }
  }
}

// Export các function để tương thích ngược
export const createPermission = PermissionService.create;
export const getPermissions = PermissionService.getAll;
export const deletePermission = PermissionService.delete; 