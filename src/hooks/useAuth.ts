import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logIn, logOut, isAuthenticated } from '../services/authenticationService';
import { getRoleFromToken } from "../services/tokenService";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await logIn(username, password);
      const token = res.result?.token;
      if (token) {
        const role = getRoleFromToken(token);
        localStorage.setItem("role", role ?? "ROLE_USER");
        localStorage.setItem("accessToken", token);
      }

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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