import { LayoutList } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Button from '../../ui/PublicUI/Button';

const ManagerTaskListPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState('TODO');

  const fetchTasks = () => {
    fetch(`http://localhost/PMS-Backd/api/tasks/get_by_project.php?project_id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTasks(data.tasks);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, [id]);

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    const response = await fetch(`http://localhost/PMS-Backd/api/tasks/create.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: id,
        title: newTitle,
        status: newStatus
      })
    });
    const result = await response.json();
    if (result.success) {
      fetchTasks();
      setNewTitle('');
      setNewStatus('TODO');
      setIsDialogOpen(false);
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
        {tasks.map(task => (
          <ListLine key={task.id} data={task} />
        ))}
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
                onChange={(e) => setNewStatus(e.target.value)}
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
              <button
                onClick={handleCreateTask}
                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm'
              >Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type TaskStatus = 'TODO' | 'In Progress' | 'Testing' | 'Done';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
}

const ListLine = ({ data }: { data: Task }) => {
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
