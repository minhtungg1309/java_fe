import { Role } from './role';

/**
 * Kiểu dữ liệu cho tạo user mới
 */
export interface CreateUserRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
}

/**
 * Kiểu dữ liệu cho cập nhật user
 */
export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  dob: string;
  password?: string;
  roles?: string[];
}

/**
 * Kiểu dữ liệu cho user
 */
export interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  dob: string | null;
  roles: Role[] | null;
} 