import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthContext } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Nếu chưa đăng nhập, redirect về trang signin
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, render children
  return <>{children}</>;
};

export default ProtectedRoute; 