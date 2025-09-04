/**
 * Kiểu dữ liệu cho permission
 */
export interface Permission {
  id?: string;
  name: string;
  description?: string;
}

/**
 * Kiểu dữ liệu cho tạo permission mới
 */
export interface CreatePermissionRequest {
  name: string;
  description: string;
}
