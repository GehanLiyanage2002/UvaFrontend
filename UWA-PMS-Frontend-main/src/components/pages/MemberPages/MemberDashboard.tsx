import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { RefreshCw, FolderKanban, CalendarDays, ListChecks, Filter, TrendingUp } from 'lucide-react';
import HomePageKanbanBoard from '../../ui/MemberUI/HomePageKanbanBoard';

// --- Types ---
 type Project = { id: number; title: string; description?: string };
 type Event = { id: number; title: string; date: string; time?: string };
 type TaskCounts = { todo: number; in_progress: number; done: number; total: number };

// --- Helpers ---
const pct = (num: number, den: number) => (den ? Math.round((num / den) * 100) : 0);

// --- Component ---
const ManagerDashboard: React.FC = () => {
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [taskOverview, setTaskOverview] = useState<TaskCounts>({ todo: 0, in_progress: 0, done: 0, total: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | ''>('');

  const refreshAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [projectsRes, eventsRes, tasksOverviewRes, upcomingEventsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BASE_URL}/api/member/projects/project.php?action=list`, { credentials: 'include' }),
        fetch(`${import.meta.env.VITE_BASE_URL}/api/member/events/event.php?action=overview`, { credentials: 'include' }),
        fetch(`${import.meta.env.VITE_BASE_URL}/api/member/tasks/task.php?action=overview`, { credentials: 'include' }),
        fetch(`${import.meta.env.VITE_BASE_URL}/api/member/events/event.php?action=upcoming&limit=5`, { credentials: 'include' }),
      ]);

      const projectsJson = await projectsRes.json();
      if (projectsJson.success && Array.isArray(projectsJson.tasks)) {
        setProjects(projectsJson.tasks);
        setTotalProjects(projectsJson.tasks.length);
        if (projectsJson.tasks.length && (selectedProject === '' || !projectsJson.tasks.find((p: Project) => p.id === selectedProject))) {
          setSelectedProject(projectsJson.tasks[0].id);
        }
      }

      const eventsJson = await eventsRes.json();
      if (eventsJson.success && eventsJson.overview) setTotalEvents(eventsJson.overview.total_events || 0);

      const tasksJson = await tasksOverviewRes.json();
      if (tasksJson.success && tasksJson.overview) {
        const o = tasksJson.overview;
        const counts: TaskCounts = {
          todo: o.todo || 0,
          in_progress: o.in_progress || 0,
          done: o.done || 0,
          total: (o.todo || 0) + (o.in_progress || 0) + (o.done || 0),
        };
        setTaskOverview(counts);
        setTotalTasks(tasksJson.overview.total_tasks || counts.total);
      }

      const upcomingJson = await upcomingEventsRes.json();
      if (upcomingJson.success && Array.isArray(upcomingJson.events)) setUpcomingEvents(upcomingJson.events);
    } catch (e: any) {
      console.error('Dashboard loading error:', e);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a project is chosen, fetch its task breakdown to override the global summary
  useEffect(() => {
    const loadProjectTasks = async () => {
      if (selectedProject === '') return;
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=list&project_id=${selectedProject}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success && Array.isArray(json.tasks)) {
          const counts = json.tasks.reduce((acc: Record<string, number>, t: any) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
          }, {});
          const c: TaskCounts = {
            todo: counts.todo || counts.TODO || 0,
            in_progress: counts.in_progress || counts['In Progress'] || 0,
            done: counts.done || counts.Done || 0,
            total: json.tasks.length,
          };
          setTaskOverview(c);
        }
      } catch (e) {
        console.error('Error loading project tasks:', e);
      }
    };
    loadProjectTasks();
  }, [selectedProject]);

  const completion = useMemo(() => pct(taskOverview.done, taskOverview.total), [taskOverview]);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-red-600 text-center">
        <div>
          <div className="text-xl mb-2">⚠️</div>
          <div>{error}</div>
          <button onClick={refreshAll} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FolderKanban size={22} /> Manager Dashboard
        </div>
        <div className="flex gap-2">
          <button onClick={refreshAll} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-2" title="Refresh">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Top row: selector + KPIs */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="min-w-[240px] lg:w-80">
          <ProjectSelector items={projects} selectedProject={selectedProject} onProjectChange={setSelectedProject} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <CountView title="Total Projects" count={totalProjects} className="bg-blue-600 hover:bg-blue-700" />
          <CountView title="Total Events" count={totalEvents} className="bg-emerald-600 hover:bg-emerald-700" />
          <CountView title="Total Tasks" count={totalTasks} className="bg-purple-600 hover:bg-purple-700" />
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatusTile label="To Do" value={taskOverview.todo} accent="border-yellow-500 text-yellow-600" />
        <StatusTile label="In Progress" value={taskOverview.in_progress} accent="border-blue-500 text-blue-600" />
        <StatusTile label="Completed" value={taskOverview.done} accent="border-green-500 text-green-600" />
        <StatusTile label="Total" value={taskOverview.total} accent="border-gray-500 text-gray-600" />
      </div>

      {/* Completion Bar */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400" />
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-2"><TrendingUp size={16} /> Overall completion</div>
            <div className="font-medium">{completion}%</div>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Project Overview</h2>
            {selectedProject !== '' && <span className="text-xs text-gray-500">Project ID: {selectedProject}</span>}
          </div>
          <HomePageKanbanBoard projectId={selectedProject === '' ? undefined : Number(selectedProject)} />
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---
const CountView = ({ className, title, count }: { className?: string; title: string; count: number }) => (
  <div className={clsx('rounded-xl p-4 text-white shadow-sm transition-colors', className)}>
    <div className="text-sm/5 font-medium opacity-90">{title}</div>
    <div className="font-bold text-3xl">{count}</div>
  </div>
);

const StatusTile = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className={clsx('bg-white p-4 rounded-xl shadow-sm border-l-4', accent)}>
    <div className="text-sm font-medium text-gray-600">{label}</div>
    <div className={clsx('font-bold text-2xl')}>{value}</div>
  </div>
);

const ProjectSelector: React.FC<{ items: Project[]; selectedProject: number | ''; onProjectChange: (projectId: number | '') => void; }> = ({ items, selectedProject, onProjectChange }) => {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-2"><Filter size={14} /> Filter by project</div>
      <select
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <option value="">All Projects</option>
        {items.length === 0 && <option value="" disabled>No projects found</option>}
        {items.map((p) => (
          <option key={p.id} value={p.id}>{p.title}</option>
        ))}
      </select>
    </div>
  );
};

export default ManagerDashboard;