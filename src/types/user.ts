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
  avatar?: string; 
  city?: string;   
  email?: string;  
  phone?: string;  
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
  avatar?: string; 
  city?: string;   
  email?: string;  
  phone?: string;  
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
  avatar: string | null; 
  city: string | null;   
  email: string | null;  
  phone: string | null;  
  roles: Role[] | null;
} 