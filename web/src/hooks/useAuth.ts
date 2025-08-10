import { useCallback } from 'react';
import { useAuthStore } from '../stores/auth.store';

export interface LoginCredentials {
  email: string;
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
        // For now, simulate authentication since we don't have auth endpoints yet
        // In a real implementation, this would make an API call
        const mockUser = {
          id: '1',
          name: 'Developer',
          email: credentials.email,
        };
        const mockToken = 'mock-jwt-token';

        loginStore(mockToken, mockUser);
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
