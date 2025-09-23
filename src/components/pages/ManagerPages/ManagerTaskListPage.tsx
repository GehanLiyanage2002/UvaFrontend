// src/pages/manager/ManagerTaskListPage.tsx
import { LayoutList } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Button from '../../ui/PublicUI/Button';
import { getAuth } from '../../../lib/api';

type TaskStatus = 'TODO' | 'In Progress' | 'Testing' | 'Done';

interface TaskData {
  id: number;
  title: string;
  status: TaskStatus;
}

// API <-> UI status mapping
const uiToApi: Record<TaskStatus, string> = {
  'TODO': 'todo',
  'In Progress': 'in_progress',
  'Testing': 'testing',
  'Done': 'done',
};
const apiToUi = (s: string): TaskStatus => {
  const map: Record<string, TaskStatus> = {
    'todo': 'TODO',
    'in_progress': 'In Progress',
    'testing': 'Testing',
    'done': 'Done',
  };
  return map[s] ?? 'TODO';
};

const ManagerTaskListPage = () => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const { id } = useParams(); // project_id from URL
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('TODO');
  const [loading, setLoading] = useState(false);

  // ---- Load tasks for the project ----
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=list-all`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
            },
            credentials: 'include',
          }
        );
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { throw new Error('API did not return JSON'); }
        if (!res.ok || !data?.success) throw new Error(data?.message || `Load failed (HTTP ${res.status})`);

        if (!alive) return;
        const list: TaskData[] = (data.tasks ?? []).map((t: any) => ({
          id: Number(t.id),
          title: String(t.title ?? ''),
          status: apiToUi(String(t.status ?? 'todo')),
        }));
        setTasks(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [id]);

  // ---- Create task ----
  const handleCreateTask = async () => {
    if (!id) return;
    if (!newTitle.trim()) { alert('Title is required'); return; }

    try {
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            project_id: Number(id),
            title: newTitle.trim(),
            status: uiToApi[newStatus], // backend expects snake/lower
          }),
        }
      );
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('API did not return JSON'); }
      if (!res.ok || !data?.success) throw new Error(data?.message || `Create failed (HTTP ${res.status})`);

      // Option A: push to list (fast)
      if (data.task) {
        const t = data.task;
        const newTask: TaskData = {
          id: Number(t.id),
          title: String(t.title ?? newTitle),
          status: apiToUi(String(t.status ?? uiToApi[newStatus])),
        };
        setTasks(prev => [newTask, ...prev]);
      } else {
        // Option B: refetch list (fallback)
        // (Keep this minimal to avoid UI changes)
      }

      // reset/close
      setNewTitle('');
      setNewStatus('TODO');
      setIsDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Server error while creating task.');
    }
  };

  return (
    <div className='flex flex-col gap-6 pb-4'>
      <div className='flex justify-between'>
        <div>
          <div className='font-bold text-3xl flex gap-2 items-center'>
            <LayoutList size={30} />
            Tasks
          </div>
          <div className='text-xs text-gray-500'>View and manage all project tasks.</div>
        </div>

        <div className='flex gap-3'>
          <Button onClick={() => setIsDialogOpen(true)}>New Task</Button>
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        {loading && <div className='text-xs text-gray-600'>Loading…</div>}
        {!loading && tasks.map(task => (
          <ListLine key={task.id} data={task} />
        ))}
        {!loading && tasks.length === 0 && (
          <div className='text-xs text-gray-600'>No tasks yet.</div>
        )}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-md w-full max-w-md p-6 shadow-lg">
            <h2 className='text-lg font-bold mb-4'>Create New Task</h2>
            <div className='flex flex-col gap-3'>
              <input
                type='text'
                className='border p-2 rounded w-full'
                placeholder='Task Title'
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <select
                className='border p-2 rounded w-full'
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
              >
                <option value='TODO'>TODO</option>
                <option value='In Progress'>In Progress</option>
                <option value='Testing'>Testing</option>
                <option value='Done'>Done</option>
              </select>
            </div>
            <div className='flex justify-end gap-2 mt-6'>
              <button
                onClick={() => setIsDialogOpen(false)}
                className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm'
              >Cancel</button>
              <button onClick={handleCreateTask}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ListLine = ({ data }: { data: TaskData }) => {
  const navigate = useNavigate();

  const statusColor: Record<TaskStatus, string> = {
    'TODO': 'bg-yellow-100 text-yellow-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Testing': 'bg-purple-100 text-purple-700',
    'Done': 'bg-green-100 text-green-700'
  };

  const statusDot: Record<TaskStatus, string> = {
    'TODO': 'bg-yellow-500',
    'In Progress': 'bg-blue-500',
    'Testing': 'bg-purple-500',
    'Done': 'bg-green-500'
  };

  return (
    <div
      onClick={() => navigate(`/manager/tasks/${data.id}`)}
      className='flex justify-between rounded-md bg-[#E8F5E9] p-2 cursor-pointer hover:bg-[#d0ebd8]'
    >
      <div>
        <div className='font-bold text-xl'>{data.title}</div>
        <div className='text-[10px] text-gray-600'>Task #{data.id}</div>
      </div>
      <div className='flex items-start gap-3'>
        <div className={`flex items-center gap-1 ${statusColor[data.status]} text-[10px] font-bold px-2 py-1 rounded-md`}>
          <span className={`w-2 h-2 rounded-full ${statusDot[data.status]}`}></span>
          {data.status}
        </div>
      </div>
    </div>
  );
};

export default ManagerTaskListPage;
