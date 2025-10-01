import { Permission } from "./permission";

/**
 * Kiểu dữ liệu cho role
 */
export interface Role {
  id?: string;
  name: string;
  description: string;
  permissions: Permission[];
}

/**
 * Kiểu dữ liệu cho tạo role mới
 */
export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}
