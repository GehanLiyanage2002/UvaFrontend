import React, { useEffect, useMemo, useState } from 'react';
import { FolderKanban, CheckCircle, Hourglass, Loader2, Circle, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Types
interface Project {
  id: number | string;
  title: string;
  description?: string;
  statusCounts?: Record<string, number>; // { TODO, 'In Progress', Testing, Done }
  updated_at?: string; // optional if API sends
  created_at?: string; // optional if API sends
}

interface ApiResponse {
  success: boolean;
  tasks: Project[];
  message?: string;
}

// Utils
const formatRelative = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

const getProgress = (counts?: Record<string, number>) => {
  const todo = counts?.['TODO'] ?? 0;
  const doing = counts?.['In Progress'] ?? 0;
  const testing = counts?.['Testing'] ?? 0;
  const done = counts?.['Done'] ?? 0;
  const total = todo + doing + testing + done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, pct };
};

const MemberProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UI controls
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'alpha'>('recent');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'In Progress' | 'Done'>('ALL');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/member/projects/project.php?action=list`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        if (response.status === 401) throw new Error('Authentication failed. Please log in again.');
        if (response.status === 500) throw new Error('Server error occurred. Please try again later.');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        const processed = (data.tasks || []).map((p) => ({
          ...p,
          statusCounts: p.statusCounts || { TODO: 0, 'In Progress': 0, Testing: 0, Done: 0 },
        }));
        setProjects(processed);
      } else {
        throw new Error(data.message || 'Failed to fetch projects');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = useMemo(() => {
    let res = [...projects];
    const q = query.trim().toLowerCase();
    if (q) res = res.filter((p) => p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));

    if (statusFilter !== 'ALL') {
      res = res.filter((p) => (p.statusCounts?.[statusFilter] ?? 0) > 0);
    }

    if (sort === 'alpha') {
      res.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      res.sort(
        (a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
      );
    }

    return res;
  }, [projects, query, statusFilter, sort]);

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-bold text-3xl flex items-center gap-2 tracking-tight">
            <FolderKanban size={28} />
            My Projects
          </div>
          <div className="text-xs text-gray-500">Projects assigned to you {projects.length ? `(${projects.length})` : ''}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-8 pr-3 py-2 text-sm rounded-xl border w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-neutral-900"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-sm rounded-xl border px-3 py-2 dark:bg-neutral-900"
          >
            <option value="ALL">All statuses</option>
            <option value="TODO">TODO</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="text-sm rounded-xl border px-3 py-2 dark:bg-neutral-900"
          >
            <option value="recent">Sort: Recent</option>
            <option value="alpha">Sort: A → Z</option>
          </select>

          <button
            onClick={fetchProjects}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-2"
            title="Refresh projects"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="min-h-[220px]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProjects} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Subcomponents
const Badge = ({ status, count }: { status: string; count: number }) => {
  let icon: React.ReactNode = <Circle size={12} />;
  let className = 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-300';

  if (status === 'TODO') {
    icon = <Hourglass size={12} />;
    className = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  } else if (status === 'In Progress') {
    icon = <Loader2 size={12} className="animate-spin" />;
    className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  } else if (status === 'Testing') {
    icon = <Circle size={12} />;
    className = 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
  } else if (status === 'Done') {
    icon = <CheckCircle size={12} />;
    className = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  }

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${className}`}>
      {icon}
      {status}: {count}
    </div>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate();
  const progress = getProgress(project.statusCounts);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/member/member-projects/${project.id}`, { state: project })}
      className="relative rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 hover:shadow-lg cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-[17px] truncate">{project.title}</div>
            {project.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{project.description}</p>
            )}
          </div>
          <span className="shrink-0 text-[10px] text-gray-400">{formatRelative(project.updated_at || project.created_at)}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {project.statusCounts && Object.entries(project.statusCounts).map(([status, count]) => (
            <Badge key={status} status={status} count={count} />
          ))}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <span>Overall progress</span>
            <span>{progress.pct}% {progress.total ? `• ${progress.total} tasks` : ''}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 overflow-hidden">
    <div className="h-1 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-4 w-3/4 bg-slate-200 rounded" />
      <div className="h-3 w-full bg-slate-200 rounded" />
      <div className="h-3 w-5/6 bg-slate-200 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="h-5 w-16 bg-slate-200 rounded" />
        <div className="h-5 w-20 bg-slate-200 rounded" />
        <div className="h-5 w-16 bg-slate-200 rounded" />
      </div>
      <div className="h-2.5 w-full bg-slate-200 rounded" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center text-center py-14 rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800">
    <FolderKanban size={48} className="opacity-60 mb-2" />
    <h4 className="font-semibold">No projects assigned to you yet</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Once a manager assigns you to a project, it will appear here with its task breakdown.</p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800">
    <div className="mb-3 text-red-500"><AlertCircle size={28} /></div>
    <h4 className="font-semibold">Couldn't load projects</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{message}</p>
    <button onClick={onRetry} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition flex items-center gap-2">
      <RefreshCw size={16} /> Try again
    </button>
  </div>
);

export default MemberProjectListPage;
