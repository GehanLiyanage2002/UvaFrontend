import React from 'react';
import { useRoutes } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';

// Public Pages
import StartPage from './components/pages/PublicPages/StartPage';
import LoginPage from './components/pages/PublicPages/LoginPage';
import CoordinatorLoginPage from './components/pages/CoordinatorPages/CoordinatorLogin';
import ResetPassword from './components/pages/PublicPages/ResetPassword';
import ForgotPassword from './components/pages/PublicPages/ForgotPassword';

// Layouts
import ManagerLayout from './components/layouts/ManagerLayout';
import MemberLayout from './components/layouts/MemberLayout';
import CoordinatorLayout from './components/layouts/CoordinatorLayout';

// Manager Pages
import ManagerDashboard from './components/pages/ManagerPages/ManagerDashboard';
import ManagerProfilePage from './components/pages/ManagerPages/ManagerProfilePage';
import ManagerProjectListPage from './components/pages/ManagerPages/ManagerProjectListPage';
import ManagerProjectViewPage from './components/pages/ManagerPages/ManagerProjectViewPage';
import ManagerTaskListPage from './components/pages/ManagerPages/ManagerTaskListPage';
import ManagerTaskViewPage from './components/pages/ManagerPages/ManagerTaskViewPage';
import ManagerReportPage from './components/pages/ManagerPages/ManagerReportPage';
import ManagerNoticePage from './components/pages/ManagerPages/ManagerNoticePage';
import ManagerCalendarPage from './components/pages/ManagerPages/ManagerCalendarPage';

// Member Pages
import MemberDashboard from './components/pages/MemberPages/MemberDashboard';
import MemberProjectListPage from './components/pages/MemberPages/MemberProjectList';
import MemberProjectViewPage from './components/pages/MemberPages/MemberProjectView';
import MemberTaskListPage from './components/pages/MemberPages/MemberTasksList';
import MemberTaskViewPage from './components/pages/MemberPages/MemberTaskViewPage';
import MemberReportHomePage from './components/pages/MemberPages/MemberReportHomePage';
import MemberCalendarPage from './components/pages/MemberPages/MemberCalendarPage';
import ProfilePage from './components/pages/MemberPages/MemberProfilePage';
import MemberNoticePage from './components/pages/MemberPages/MemberNoticePage';

// Coordinator Pages
import CoordinatorDashboardPage from './components/pages/CoordinatorPages/CoordinatorDashboard';
import CoordinatorProjectListPage from './components/pages/CoordinatorPages/CoordinatorProjectList';
import SupervisorPage from './components/pages/CoordinatorPages/SupervisorPage';
import CoordinatorNoticePage from './components/pages/CoordinatorPages/CoordinatorNoticePage';
import CoordinatorReportHomePage from './components/pages/CoordinatorPages/CoordinatorReportPage';
import CoordinatorCalendarPage from './components/pages/CoordinatorPages/CoordinatorCalendarPage';
import CoordinatorProfilePage from './components/pages/CoordinatorPages/CoordinatorProfilePage';
import LogoutPage from './components/pages/PublicPages/LogoutPage';

const RouteConfigs = () => {
  const routes = useRoutes([
    // Public routes
    { path: '/', element: <StartPage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/logincoordinator', element: <CoordinatorLoginPage /> },
    { path: '/logout', element: <LogoutPage /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/reset-password', element: <ResetPassword /> }, // Shared logout handler

    // Manager routes
    {
      path: '/manager',
      element: <ProtectedRoute allowedRole="manager" />,
      children: [
        {
          path: '',
          element: <ManagerLayout />,
          children: [
            { index: true, element: <ManagerDashboard /> },
            { path: 'projects', element: <ManagerProjectListPage /> },
            { path: 'projects/:id', element: <ManagerProjectViewPage /> },
            { path: 'tasks', element: <ManagerTaskListPage /> },
            { path: "/manager/projects/:id/tasks", element: <ManagerTaskListPage />},
            { path: 'reports', element: <ManagerReportPage /> },
            { path: 'notices', element: <ManagerNoticePage /> },
            { path: 'calendar', element: <ManagerCalendarPage /> },
            { path: 'profile', element: <ManagerProfilePage /> },
          ],
        },
      ],
    },

    // Member routes
    {
      path: '/member',
      element: <ProtectedRoute allowedRole="member" />,
      children: [
        {
          path: '',
          element: <MemberLayout />,
          children: [
            { index: true, element: <MemberDashboard /> },
            { path: 'member-projects', element: <MemberProjectListPage /> },
            { path: 'member-projects/:id', element: <MemberProjectViewPage /> },
            { path: 'member-tasks', element: <MemberTaskListPage /> },
            { path: 'tasks/:id', element: <MemberTaskViewPage /> },
            { path: 'member-reports', element: <MemberReportHomePage /> },
            { path: 'calendar', element: <MemberCalendarPage /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'member-notices', element: <MemberNoticePage /> },
          ],
        },
      ],
    },

    // Coordinator routes
    {
      path: '/coordinator',
      element: <ProtectedRoute allowedRole="coordinator" />,
      children: [
        {
          path: '',
          element: <CoordinatorLayout />,
          children: [
            { index: true, element: <CoordinatorDashboardPage /> },
            { path: 'dashboard', element: <CoordinatorDashboardPage /> },
            { path: 'projects', element: <CoordinatorProjectListPage /> },
            { path: 'supervisors', element: <SupervisorPage /> },
            { path: 'notices', element: <CoordinatorNoticePage /> },
            { path: 'reports', element: <CoordinatorReportHomePage /> },
            { path: 'calendar', element: <CoordinatorCalendarPage /> },
            { path: 'profile', element: <CoordinatorProfilePage /> },
          ],
        },
      ],
    },
  ]);

  return routes;
};

export default RouteConfigs;
