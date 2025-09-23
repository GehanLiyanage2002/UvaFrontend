import React, { useEffect, useMemo, useState } from 'react';
import { AppWindow, CheckCircle, Hourglass, Loader2, Circle, AlertCircle, Calendar, User2, ClipboardCheck, RefreshCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import HomePageKanbanBoard from '../../ui/MemberUI/HomePageKanbanBoard';
import { motion } from 'framer-motion';

// Types
interface Member {
  id?: string;
  name: string;
  email: string;
}

interface Supervisor {
  full_name: string;
  email: string;
  assigned_at: string; // ISO or "YYYY-MM-DD HH:mm:ss"
}

interface ProjectView {
  id: number;
  title: string;
  description?: string | null;
  manager?: string | null;
  manager_name?: string;
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null;   // YYYY-MM-DD
  members?: Member[];
  task_counts?: Record<string, number>; // { TODO, 'In Progress', Testing, Done }
  supervisors?: Supervisor[];
  updated_at?: string;
  created_at?: string;
}

// ---- utils ----
const prettyDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  const [y, m, d] = dateString.split('-').map(Number);
  if (!y || !m || !d) return dateString;
  return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
};

const getProgress = (counts?: Record<string, number>) => {
  const todo = counts?.['TODO'] ?? 0;
  const doing = counts?.['In Progress'] ?? 0;
  const testing = counts?.['Testing'] ?? 0;
  const done = counts?.['Done'] ?? 0;
  const total = todo + doing + testing + done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { todo, doing, testing, done, total, pct };
};

// ---- component ----
const MemberProjectViewPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [project, setProject] = useState<ProjectView | null>(null);

  const fetchProject = async () => {
    if (!id) {
      setError('Invalid project ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/member/projects/project.php?action=view&id=${encodeURIComponent(id)}`,
        { credentials: 'include' }
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Non-JSON from view API:\n', text);
        throw new Error('API did not return JSON');
      }

      if (response.ok && data?.success && data?.task) {
        const p: ProjectView = data.task;
        p.task_counts = p.task_counts || { TODO: 0, 'In Progress': 0, Testing: 0, Done: 0 };
        setProject(p);
      } else {
        if (response.status === 404) setError("Project not found or you don't have access to it.");
        else if (response.status === 401) setError('Authentication failed. Please log in again.');
        else if (response.status === 400) setError('Invalid project ID provided.');
        else if (response.status === 500) setError('Server error occurred. Please try again later.');
        else setError(data?.message || 'Failed to load project');
      }
    } catch (err: any) {
      console.error('View project error:', err);
      setError('Network error while loading project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const progress = useMemo(() => getProgress(project?.task_counts), [project]);

  // ---- states ----
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchProject} />;
  if (!project) return <NotFoundState />;

  const pid = Number(id);

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-center font-bold text-3xl tracking-tight">
          <AppWindow size={28} />
          {project.title}
        </div>
        <div className="text-xs text-gray-500">{project.description || 'No description available'}</div>
      </div>

      {/* At-a-glance stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<User2 size={16} />} label="Project Manager" value={project.manager_name || project.manager || '-'} />
        <StatCard icon={<Calendar size={16} />} label="Start" value={prettyDate(project.start_date)} />
        <StatCard icon={<Calendar size={16} />} label="End" value={prettyDate(project.end_date)} />
        <StatCard icon={<ClipboardCheck size={16} />} label="Completion" value={`${progress.pct}%`} />
      </div>

      {/* Status badges + progress */}
      <div className="rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400" />
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="TODO" count={progress.todo} />
            <StatusBadge status="In Progress" count={progress.doing} />
            <StatusBadge status="Testing" count={progress.testing} />
            <StatusBadge status="Done" count={progress.done} />
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
              <span>Overall progress</span>
              <span>{progress.pct}% {progress.total ? `• ${progress.total} tasks` : ''}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.pct}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Supervisors */}
      <section className="rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400" />
        <div className="p-4">
          <h3 className="font-semibold mb-3">Supervisors</h3>
          <div className="grid grid-cols-3 text-xs font-medium border-b">
            <div className="border-r p-2">Supervisor's Name</div>
            <div className="border-r p-2">Supervisor's Email</div>
            <div className="p-2">Assigned At</div>
          </div>
          {(!project.supervisors || project.supervisors.length === 0) ? (
            <div className="text-xs p-3 text-gray-500">No supervisors assigned.</div>
          ) : (
            project.supervisors.map((s, i) => (
              <div key={i} className="grid grid-cols-3 text-xs border-b">
                <div className="border-r p-2">{s.full_name}</div>
                <div className="border-r p-2">{s.email}</div>
                <div className="p-2">{prettyDate((s.assigned_at || '').split(' ')[0])}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Members */}
      <section className="rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400" />
        <div className="p-4">
          <h3 className="font-semibold mb-3">Members</h3>
          <div className="grid grid-cols-3 text-xs font-medium border-b">
            <div className="border-r p-2">Enrollment Number</div>
            <div className="border-r p-2">Name</div>
            <div className="p-2">Email</div>
          </div>
          {(!project.members || project.members.length === 0) ? (
            <div className="text-xs p-3 text-gray-500">No members assigned to this project.</div>
          ) : (
            project.members.map((m, i) => (
              <div key={i} className="grid grid-cols-3 text-xs border-b">
                <div className="border-r p-2">{m.id || '-'}</div>
                <div className="border-r p-2">{m.name}</div>
                <div className="p-2">{m.email}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Kanban */}
      <section className="rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400" />
        <div className="p-4">
          <h3 className="font-semibold mb-3">Task Board</h3>
          <HomePageKanbanBoard projectId={isNaN(pid) ? project.id : pid} />
        </div>
      </section>
    </div>
  );
};

// ---- pieces ----
const StatusBadge = ({ status, count }: { status: string; count: number }) => {
  let icon: React.ReactNode = <Circle size={14} />;
  let className = 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-300';
  if (status === 'TODO') { icon = <Hourglass size={14} />; className = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'; }
  else if (status === 'In Progress') { icon = <Loader2 size={14} className="animate-spin" />; className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'; }
  else if (status === 'Testing') { icon = <Circle size={14} />; className = 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'; }
  else if (status === 'Done') { icon = <CheckCircle size={14} />; className = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'; }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${className} text-xs font-medium`}>
      {icon}
      {status}: {count}
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 p-4">
    <div className="text-[11px] text-gray-500 flex items-center gap-2 mb-1">{icon}<span>{label}</span></div>
    <div className="font-semibold text-sm truncate" title={String(value)}>{value}</div>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col gap-6 pb-6">
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center font-bold text-3xl">
        <AppWindow size={28} />
        Loading Project...
      </div>
      <div className="text-xs text-gray-500">Fetching project details...</div>
    </div>
    <div className="rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-4 w-2/3 bg-slate-200 rounded" />
        <div className="h-3 w-5/6 bg-slate-200 rounded" />
        <div className="h-3 w-4/6 bg-slate-200 rounded" />
        <div className="h-2.5 w-full bg-slate-200 rounded" />
      </div>
    </div>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col gap-6 pb-6">
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center font-bold text-3xl">
        <AppWindow size={28} />
        Project Error
      </div>
      <div className="text-xs text-gray-500">Failed to load project</div>
    </div>
    <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800">
      <div className="flex items-center gap-2 text-red-600"><AlertCircle size={20} />{message}</div>
      <button onClick={onRetry} className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition flex items-center gap-2">
        <RefreshCw size={16} /> Try Again
      </button>
    </div>
  </div>
);

const NotFoundState = () => (
  <div className="flex flex-col gap-6 pb-6">
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center font-bold text-3xl">
        <AppWindow size={28} />
        Project Not Found
      </div>
      <div className="text-xs text-gray-500">The requested project could not be found</div>
    </div>
  </div>
);

export default MemberProjectViewPage;
