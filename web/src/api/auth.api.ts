import { apiClient } from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  username: string;
  isAdmin: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response;
  },
};