import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";

export interface CreateUserRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
}

export interface User {
  id: string | number;
  username: string;
  firstName: string;
  lastName: string;
  dob: string;
}

export const createUser = async (user: CreateUserRequest): Promise<User> => {
  const response = await httpClient.post(API.CREATE_USER, user);
  return response.data;
};
