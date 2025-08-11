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
export interface LogoutResponse {
  message: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse, LoginResponse>(
      '/auth/login',
      credentials,
    );
    return response;
  },

  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse, LogoutResponse>(
      '/auth/logout',
    );
    return response;
  },
};
