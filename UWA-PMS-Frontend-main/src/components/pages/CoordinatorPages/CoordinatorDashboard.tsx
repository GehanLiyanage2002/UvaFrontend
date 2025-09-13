import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Calendar, Users, FolderOpen, Clock } from 'lucide-react';
import { getAuth } from '../../../lib/api'; // Assuming you have this for auth

import CalendarArea from '../../ui/PublicUI/CalendarArea';
import SupervisorCard from '../../ui/PublicUI/SupervisorCard';

type Project = {
  id: number;
  title: string;
  description?: string;
  todo_count: number;
  in_progress_count: number;
  done_count: number;
  testing_count: number;
  supervisors?: string;
  supervisor_id?: string;
};

type Event = {
  id: number;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  meet_link?: string;
  created_at?: string;
  updated_at?: string;
};

type DashboardStats = {
  totalProjects: number;
  totalSupervisors: number;
  totalEvents: number;
  recentProjects: Project[];
  upcomingEvents: Event[];
};

const CoordinatorDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalSupervisors: 0,
    totalEvents: 0,
    recentProjects: [],
    upcomingEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const headers = {
        'Content-Type': 'application/json',
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      };

      // Fetch projects, supervisors, and events in parallel
      const [projectsRes, supervisorsRes, eventsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BASE_URL}/api/coordinator/projects/project.php?action=list`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
        fetch(`${import.meta.env.VITE_BASE_URL}/api/coordinator/supervisors/supervisor.php?action=list`, {
          method: 'GET',
          headers,
          credentials: 'include',
        }),
        fetch(`${import.meta.env.VITE_BASE_URL}/api/coordinator/events/event.php?action=list`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })
      ]);

      // Parse all responses
      const [projectsData, supervisorsData, eventsData] = await Promise.all([
        parseResponse(projectsRes, 'projects'),
        parseResponse(supervisorsRes, 'supervisors'),
        parseResponse(eventsRes, 'events')
      ]);

      // Process projects (API returns 'tasks' array)
      const projects = projectsData?.tasks || [];
      const recentProjects = projects.slice(0, 5); // Get 5 most recent

      // Process supervisors
      const supervisors = supervisorsData?.supervisors || [];

      // Process events (API returns 'events' array, uses 'date' field)
      const events = eventsData?.events || [];
      const today = new Date();
      const upcomingEvents = events
        .filter((event: any) => {
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          return eventDate >= today;
        })
        .slice(0, 5); // Get 5 upcoming events

      setStats({
        totalProjects: projects.length,
        totalSupervisors: supervisors.length,
        totalEvents: events.length,
        recentProjects,
        upcomingEvents
      });

    } catch (e: any) {
      console.error('Dashboard fetch error:', e);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse API responses
  const parseResponse = async (response: Response, context: string) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error(`Non-JSON from ${context} API:\n`, text);
      throw new Error(`${context} API did not return JSON`);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Welcome, Coordinator!</h1>
          <p className="text-sm text-gray-600">Monitor, manage, and schedule across UWU project teams.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:max-w-3xl">
          {loading ? (
            // Loading skeleton
            <>
              <div className="bg-gray-200 animate-pulse rounded-lg p-4 h-20"></div>
              <div className="bg-gray-200 animate-pulse rounded-lg p-4 h-20"></div>
              <div className="bg-gray-200 animate-pulse rounded-lg p-4 h-20"></div>
            </>
          ) : (
            <>
              <CountView 
                title="Total Projects" 
                count={stats.totalProjects} 
                className="bg-blue-800" 
                icon={<FolderOpen size={20} />}
              />
              <CountView 
                title="Total Supervisors" 
                count={stats.totalSupervisors} 
                className="bg-purple-700" 
                icon={<Users size={20} />}
              />
              <CountView 
                title="Total Events" 
                count={stats.totalEvents} 
                className="bg-green-700" 
                icon={<Calendar size={20} />}
              />
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 border border-red-300 rounded p-3 bg-red-50">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Recent Projects */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FolderOpen size={20} />
                Recent Projects
              </h2>
              <button 
                onClick={() => navigate('/coordinator/projects')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-100 animate-pulse rounded p-3 h-16"></div>
                ))}
              </div>
            ) : stats.recentProjects.length > 0 ? (
              <div className="space-y-3">
                {stats.recentProjects.map((project) => (
                  <div key={project.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{project.title}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1 truncate">{project.description}</p>
                        )}
                        {project.supervisors && (
                          <p className="text-xs text-gray-500 mt-1">
                            Supervisor: {project.supervisors}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Todo: {project.todo_count}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Progress: {project.in_progress_count}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          Done: {project.done_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                No projects available
              </div>
            )}
          </div>

          {/* Calendar Area */}
          <div className="bg-white rounded-lg border">
            <CalendarArea />
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock size={18} />
                Upcoming Events
              </h2>
              <button 
                onClick={() => navigate('/coordinator/events')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-100 animate-pulse rounded p-3 h-12"></div>
                ))}
              </div>
            ) : stats.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                    <h3 className="font-medium text-gray-800 text-sm">{event.title}</h3>
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-gray-600">
                        📅 {formatDate(event.date || '')}
                      </p>
                      {event.time && (
                        <p className="text-xs text-gray-600">
                          🕐 {event.time}
                        </p>
                      )}
                      {event.meet_link && (
                        <p className="text-xs text-blue-600 truncate">
                          🔗 Meeting Link Available
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4 text-sm">
                No upcoming events
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/coordinator/projects')}
                className="w-full text-left p-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <FolderOpen size={16} />
                Manage Projects
              </button>
              <button 
                onClick={() => navigate('/coordinator/supervisors')}
                className="w-full text-left p-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Users size={16} />
                Manage Supervisors
              </button>
              <button 
                onClick={() => navigate('/coordinator/events')}
                className="w-full text-left p-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <CalendarPlus size={16} />
                Schedule Event
              </button>
              <button 
                onClick={() => navigate('/coordinator/notices')}
                className="w-full text-left p-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Calendar size={16} />
                Create Notice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CountView = ({ 
  className, 
  title, 
  count, 
  icon 
}: { 
  className: string; 
  title: string; 
  count: number;
  icon?: React.ReactNode;
}) => {
  return (
    <div className={clsx('rounded-lg p-4 text-white shadow-md', className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="font-bold text-3xl">{count}</div>
        </div>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
    </div>
  );
};

export default CoordinatorDashboardPage;