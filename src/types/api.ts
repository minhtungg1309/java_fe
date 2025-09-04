/**
 * Kiểu dữ liệu wrapper cho response API
 */
export interface ApiResponse<T> {
  result?: T;
  data?: T;
  message?: string;
  success?: boolean;
}

/**
 * Kiểu dữ liệu cho error response
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Kiểu dữ liệu cho pagination
 */
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
