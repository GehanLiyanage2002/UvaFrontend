import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

type Props = {
  allowedRole: 'manager' | 'member' | 'coordinator';
};

const ProtectedRoute: React.FC<Props> = ({ allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const redirectPath = {
    manager: '/login',
    member: '/login',
    coordinator: '/logincoordinator'
  }[allowedRole];

  if (!user?.role || user.role !== allowedRole) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
