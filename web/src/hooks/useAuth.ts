import { useCallback } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '../api/auth.api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: loginStore,
    logout: logoutStore,
    setLoading,
  } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        const response = await authApi.login(credentials);
        
        const user = {
          id: response.user.userId,
          name: response.user.username,
          email: `${response.user.username}@afk.local`, // Legacy compatibility
        };

        loginStore(response.token, user);
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loginStore, setLoading],
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // In a real implementation, this would make an API call to invalidate the token
      logoutStore();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [logoutStore, setLoading]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
