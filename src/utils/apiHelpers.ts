import { ApiResponse } from '../types/api';

/**
 * Hàm helper để xử lý response từ API
 * @param response - Response từ API
 * @returns Dữ liệu đã được xử lý
 */
export const handleApiResponse = <T>(response: unknown): T => {
  const data = response as { data: ApiResponse<T> | T };
  
  // Nếu response có thuộc tính result, trả về nó
  if (data?.data && typeof data.data === 'object' && 'result' in data.data) {
    return (data.data as ApiResponse<T>).result as T;
  }
  
  // Nếu response có thuộc tính data, trả về nó
  if (data?.data && typeof data.data === 'object' && 'data' in data.data) {
    return (data.data as ApiResponse<T>).data as T;
  }
  
  // Ngược lại, trả về data trực tiếp
  return data.data as T;
};

/**
 * Tạo URL với tham số động
 * @param template - Template URL với placeholder
 * @param params - Các tham số cần thay thế
 * @returns URL đã được thay thế
 */
export const createUrl = (template: string, params: Record<string, string | number>): string => {
  let url = template;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value.toString());
  });
  return url;
};

/**
 * Xử lý lỗi API một cách nhất quán
 * @param error - Lỗi từ API
 * @param defaultMessage - Message mặc định
 * @returns Error object
 */
export const handleApiError = (error: unknown, defaultMessage: string): Error => {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    const apiError = error as { response?: { data?: { message?: string } } };
    const message = apiError.response?.data?.message || defaultMessage;
    return new Error(message);
  }
  
  return new Error(defaultMessage);
}; 