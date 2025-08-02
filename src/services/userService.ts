import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";

// Types
export interface CreateUserRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  dob: string;
  password?: string;
}

export interface User {
  id: string | number;
  username: string;
  firstName: string;
  lastName: string;
  dob: string;
}

// Response wrapper type
interface ApiResponse<T> {
  result?: T;
  data?: T;
  message?: string;
  success?: boolean;
}

// Helper function to handle API responses
const handleApiResponse = <T>(response: any): T => {
  const data = response.data as ApiResponse<T> | T;
  
  // If response has result property, return it
  if (data && typeof data === 'object' && 'result' in data) {
    return (data as ApiResponse<T>).result as T;
  }
  
  // If response has data property, return it
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as ApiResponse<T>).data as T;
  }
  
  // Otherwise, return the data directly
  return data as T;
};

// User API functions
export const createUser = async (user: CreateUserRequest): Promise<User> => {
  try {
    const response = await httpClient.post(API.CREATE_USER, user);
    return handleApiResponse<User>(response);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await httpClient.get(API.GET_USERS);
    return handleApiResponse<User[]>(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUser = async (id: string | number, user: Partial<UpdateUserRequest>): Promise<User> => {
  try {
    const url = API.UPDATE_USER.replace('{userId}', id.toString());
    const response = await httpClient.put(url, user);
    return handleApiResponse<User>(response);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: string | number): Promise<void> => {
  try {
    const url = API.DELETE_USER.replace('{userId}', id.toString());
    await httpClient.delete(url);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};