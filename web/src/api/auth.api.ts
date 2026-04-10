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

export interface SetupStatusResponse {
  setupRequired: boolean;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
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

  getSetupStatus: async (): Promise<SetupStatusResponse> => {
    const response = await apiClient.get<SetupStatusResponse, SetupStatusResponse>(
      '/auth/setup-status',
    );
    return response;
  },

  setup: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse, LoginResponse>(
      '/auth/setup',
      credentials,
    );
    return response;
  },

  updatePassword: async (data: UpdatePasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }, { message: string }>(
      '/auth/update-password',
      data,
    );
    return response;
  },
};
