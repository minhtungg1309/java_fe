import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logIn, logOut, isAuthenticated } from '../services/authenticationService';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await logIn(username, password);
      
      // Redirect sau khi đăng nhập thành công
      navigate('/');
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logOut();
    navigate('/signin');
  };

  return {
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    login: handleLogin,
    logout: handleLogout
  };
}; 