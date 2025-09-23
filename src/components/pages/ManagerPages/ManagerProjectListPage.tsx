import { AppWindow, CheckCircle, Hourglass, Loader2, Circle, Plus, Filter, Search, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import NewProjectDialogPage from './NewProjectDialogPage';
import Button from '../../ui/PublicUI/Button';
import { motion } from 'framer-motion';

// If you already manage roles globally, replace this with your real auth state
const isProjectManager = true;

// ---- Types ----
interface Project {
  id: number | string;
  title: string;
  description?: string;
  todo_count?: number;
  in_progress_count?: number;
  testing_count?: number;
  done_count?: number;
  created_at?: string; // ISO
  updated_at?: string; // ISO
}

// ---- Utilities ----
const cn = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

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

// Compute progress from counts
const getProgress = (p: Project) => {
  const todo = p.todo_count ?? 0;
  const doing = p.in_progress_count ?? 0;
  const testing = p.testing_count ?? 0; // kept for future
  const done = p.done_count ?? 0;
  const total = todo + doing + testing + done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, pct };
};

// ---- Main Component ----
const ManagerProjectListPage = () => {
  const newProjectDialog = useDisclosure();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'In Progress' | 'Done'>('ALL');
  const [sort, setSort] = useState<'recent' | 'alpha'>('recent');

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/projects/list.php`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.message || 'Failed to load projects');
      }
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // derived list
  const filtered = useMemo(() => {
    let res = [...projects];
    // search
    const q = query.trim().toLowerCase();
    if (q) {
      res = res.filter(p =>
        p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      );
    }
    // status filter
    if (statusFilter !== 'ALL') {
      res = res.filter(p => {
        const map: Record<string, number> = {
          'TODO': p.todo_count ?? 0,
          'In Progress': p.in_progress_count ?? 0,
          'Done': p.done_count ?? 0,
        };
        return (map[statusFilter] || 0) > 0;
      });
    }
    // sort
    if (sort === 'alpha') {
      res.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // recent by updated_at / created_at
      res.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
    }
    return res;
  }, [projects, query, statusFilter, sort]);

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-bold text-3xl flex gap-2 items-center tracking-tight">
            <AppWindow size={28} />
            Projects
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Create and manage your projects easily.</p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-8 pr-3 py-2 text-sm rounded-xl border w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-neutral-900"
            />
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Filter by status"
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
              aria-label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="text-sm rounded-xl border px-3 py-2 dark:bg-neutral-900"
            >
              <option value="recent">Sort: Recent</option>
              <option value="alpha">Sort: A → Z</option>
            </select>
          </div>

          <Button onClick={loadProjects} className="flex items-center gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>

          {isProjectManager && (
            <Button onClick={newProjectDialog.onOpen} className="flex items-center gap-2">
              <Plus size={16} /> New Project
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadProjects} />
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={isProjectManager ? newProjectDialog.onOpen : undefined} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((proj) => (
              <ProjectCard key={proj.id} data={proj} />)
            )}
          </div>
        )}
      </div>

      <NewProjectDialogPage disclosure={newProjectDialog} onProjectCreated={loadProjects} />
    </div>
  );
};

// ---- Subcomponents ----
const Badge = ({ label, count }: { label: 'TODO' | 'In Progress' | 'Done' | string; count: number }) => {
  let icon = <Circle size={12} />;
  let className = 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-300';

  if (label === 'TODO') {
    icon = <Hourglass size={12} />;
    className = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  } else if (label === 'In Progress') {
    icon = <Loader2 size={12} className="animate-spin" />;
    className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  } else if (label === 'Done') {
    icon = <CheckCircle size={12} />;
    className = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  }

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', className)}>
      {icon}
      {label}: {count}
    </div>
  );
};

const ProjectCard = ({ data }: { data: Project }) => {
  const navigate = useNavigate();
  const { pct, total } = getProgress(data);

  return (
    <motion.div
      onClick={() => navigate(`/manager/projects/${data.id}`)}
      whileHover={{ y: -2 }}
      className="relative rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800 hover:shadow-lg cursor-pointer overflow-hidden"
    >
      {/* subtle gradient header */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400" />

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-[17px] truncate">{data.title}</h3>
            {data.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{data.description}</p>
            )}
          </div>
          <span className="shrink-0 text-[10px] text-gray-400">{formatRelative(data.updated_at || data.created_at)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label="TODO" count={data.todo_count ?? 0} />
          <Badge label="In Progress" count={data.in_progress_count ?? 0} />
          <Badge label="Done" count={data.done_count ?? 0} />
        </div>

        {/* progress */}
        <div className="mt-1">
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <span>Overall progress</span>
            <span>{pct}% {total ? `• ${total} tasks` : ''}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400"
              style={{ width: `${pct}%` }}
            />
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

const EmptyState = ({ onCreate }: { onCreate?: () => void }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800">
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
      <circle cx="36" cy="36" r="34" className="stroke-gray-300" strokeWidth="2" fill="none" />
      <path d="M24 30h24M24 38h24M24 46h16" className="stroke-gray-400" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <h4 className="font-semibold">No projects yet</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Create your first project to start tracking tasks, progress and timelines in one place.</p>
    {onCreate && (
      <Button onClick={onCreate} className="mt-4 flex items-center gap-2">
        <Plus size={16} /> New Project
      </Button>
    )}
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 rounded-2xl border bg-white dark:bg-neutral-950/80 dark:border-neutral-800">
    <div className="mb-3 text-red-500"><Circle size={28} /></div>
    <h4 className="font-semibold">Couldn\'t load projects</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{message}</p>
    <Button onClick={onRetry} className="mt-4 flex items-center gap-2">
      <RefreshCw size={16} /> Try again
    </Button>
  </div>
);

export default ManagerProjectListPage;
