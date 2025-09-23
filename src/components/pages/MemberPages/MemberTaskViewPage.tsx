import React from 'react';
import { ListChecks, CheckCircle, Hourglass, Loader2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MemberTaskList: React.FC = () => {
  const navigate = useNavigate();

  const tasks = [
    {
      id: 1,
      name: 'Design Login Page',
      description: 'Create login form with validation',
      status: 'TODO',
      assignedTo: 'K N P J Ananda',
      deadline: '2025-06-20',
    },
    {
      id: 2,
      name: 'Fix API Integration',
      description: 'Update Axios config and retry logic',
      status: 'In Progress',
      assignedTo: 'D G C Liyanage',
      deadline: '2025-06-21',
    },
  ];

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Badge color="yellow" icon={<Hourglass size={14} />} label="To Do" />;
      case 'In Progress':
        return <Badge color="blue" icon={<Loader2 size={14} className="animate-spin" />} label="In Progress" />;
      case 'Testing':
        return <Badge color="purple" icon={<Circle size={14} />} label="Testing" />;
      case 'Done':
        return <Badge color="green" icon={<CheckCircle size={14} />} label="Done" />;
      default:
        return <Badge color="gray" icon={<Circle size={14} />} label="Unknown" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex justify-between">
        <div>
          <div className="font-bold text-3xl flex gap-2 items-center">
            <ListChecks size={30} />
            My Tasks
          </div>
          <div className="text-xs text-gray-500">Tasks assigned to you</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => navigate(`/member/tasks/${task.id}`, { state: task })}
            className="flex justify-between items-center rounded-md bg-[#E8F5E9] p-3 cursor-pointer hover:shadow-md transition"
          >
            <div>
              <div className="font-bold text-lg">{task.name}</div>
              <div className="text-[10px] text-gray-600">{task.description}</div>
            </div>
            <div>{renderStatusBadge(task.status)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Badge = ({ color, icon, label }: { color: string; icon: React.ReactNode; label: string }) => {
  const colors: any = {
    yellow: 'text-yellow-700 bg-yellow-100',
    blue: 'text-blue-700 bg-blue-100',
    purple: 'text-purple-700 bg-purple-100',
    green: 'text-green-700 bg-green-100',
    gray: 'text-gray-700 bg-gray-100',
  };
  return (
    <div className={`flex items-center gap-1 ${colors[color]} px-3 py-1 rounded-full text-xs font-semibold`}>
      {icon}
      {label}
    </div>
  );
};

export default MemberTaskList;