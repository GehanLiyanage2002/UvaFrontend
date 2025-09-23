import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AppWindow,
  CheckCircle,
  Hourglass,
  Loader2,
  Circle,
} from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

type TaskStatus = 'TODO' | 'In Progress' | 'Testing' | 'Done';

type Task = {
  id: string;
  title: string;
  description: string;
  avatar: string;
  status: TaskStatus;
};

const TaskViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      title: 'Design UI',
      description: 'Create UI in Figma',
      avatar: 'https://i.pravatar.cc/100?img=7',
      status: 'TODO',
    },
  ]);

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      timestamp: '2025-06-10 10:30AM',
      author: 'K N P J Ananda',
      message: 'Initial task assigned. Starting development soon.',
    },
    {
      id: 2,
      timestamp: '2025-06-11 03:15PM',
      author: 'D G C Liyanage',
      message: 'Reviewed the task plan and approved.',
    },
  ]);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: comments.length + 1,
      timestamp: new Date().toLocaleString(),
      author: 'You',
      message: commentText,
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const draggedTaskId = result.draggableId;
    const newStatus = destination.droppableId as TaskStatus;

    setTasks(prev =>
      prev.map(task =>
        task.id === draggedTaskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const getStatusBadge = (status: TaskStatus) => {
    const base =
      'text-xs font-semibold rounded-full px-2 py-1 flex items-center gap-1';
    switch (status) {
      case 'TODO':
        return (
          <div className={`${base} bg-yellow-100 text-yellow-700`}>
            <Hourglass size={14} />
            To Do
          </div>
        );
      case 'In Progress':
        return (
          <div className={`${base} bg-blue-100 text-blue-700`}>
            <Loader2 size={14} className='animate-spin' />
            In Progress
          </div>
        );
      case 'Testing':
        return (
          <div className={`${base} bg-purple-100 text-purple-700`}>
            <Circle size={14} />
            Testing
          </div>
        );
      case 'Done':
        return (
          <div className={`${base} bg-green-100 text-green-700`}>
            <CheckCircle size={14} />
            Done
          </div>
        );
      default:
        return (
          <div className={`${base} bg-gray-100 text-gray-700`}>
            <Circle size={14} />
            Unknown
          </div>
        );
    }
  };

  const bgColorMap: Record<TaskStatus, string> = {
    TODO: 'bg-yellow-50',
    'In Progress': 'bg-blue-50',
    Testing: 'bg-purple-50',
    Done: 'bg-green-50',
  };

  const borderColorMap: Record<TaskStatus, string> = {
    TODO: 'border-yellow-400',
    'In Progress': 'border-blue-400',
    Testing: 'border-purple-400',
    Done: 'border-green-400',
  };

  const groupedTasks: Record<TaskStatus, Task[]> = {
    TODO: [],
    'In Progress': [],
    Testing: [],
    Done: [],
  };
  tasks.forEach(task => {
    groupedTasks[task.status].push(task);
  });

  return (
    <div className='flex flex-col gap-6 pb-4 px-4'>
      <div className='flex justify-between'>
        <div>
          <div className='font-bold text-3xl flex gap-2 items-center'>
            <AppWindow size={30} />
            Task Name #{id}
          </div>
          <div className='text-xs text-gray-500'>This is the task description.</div>
        </div>
      </div>

      <div className='flex flex-col lg:flex-row justify-between gap-4'>
  <div className='flex flex-col w-full lg:w-1/2 border rounded-md h-48 overflow-y-auto'>
    <TupleCardRow data={{ title: 'Task', value: tasks[0].title }} />
    <TupleCardRow data={{ title: 'Assigned Member', value: 'K N P J Ananda' }} />
    <TupleCardRow data={{ title: 'Deadline', value: '2025-06-25' }} />
    <TupleCardRow data={{ title: 'Status', value: getStatusBadge(tasks[0].status) }} isComponent />
  </div>

  <div className='border rounded-md p-4 text-sm flex flex-col gap-2 w-full lg:w-1/2 h-48 overflow-y-auto'>
    <h2 className='text-base font-semibold'>Leave a Comment</h2>
    <textarea
      value={commentText}
      onChange={(e) => setCommentText(e.target.value)}
      className='w-full border rounded-md p-2 text-sm resize-none'
      rows={4}
      placeholder='Write your comment here...'
    />
    <button
      onClick={handleAddComment}
      className='self-end px-4 py-1 text-xs font-semibold bg-gray-600 text-white rounded-md hover:bg-black'
    >
      Submit Comment
    </button>
  </div>
</div>


      <div className='border rounded-md p-4 flex flex-col gap-4 mt-4'>
        <h2 className='text-base font-semibold text-gray-800'>Task Status</h2>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {Object.entries(groupedTasks).map(([columnId, taskList]) => (
              <Droppable droppableId={columnId} key={columnId}>
                {(provided) => (
                  <div className='rounded-md shadow overflow-hidden'>
                    <div className='bg-cyan-700 text-white p-2 text-center font-semibold'>
                      {columnId}
                    </div>
                    <div
                      className='p-3 space-y-3 min-h-[100px] bg-white'
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {taskList.map((task, index) => (
                        <Draggable draggableId={task.id} index={index} key={task.id}>
                          {(provided) => (
                            <div
                              className={`rounded-md ${bgColorMap[columnId as TaskStatus]} p-3 shadow-sm border-l-4 ${borderColorMap[columnId as TaskStatus]} flex justify-between items-start`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <div>
                                <div className='font-bold text-sm'>{task.title}</div>
                                <div className='text-xs text-gray-500'>{task.description}</div>
                              </div>
                              <img
                                src={task.avatar}
                                className='w-6 h-6 rounded-full ml-2'
                                alt='avatar'
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='text-base font-semibold'>Comments</h2>
        {comments.map((comment) => (
          <div key={comment.id} className='bg-gray-200 p-3 rounded-md'>
            <div className='flex flex-col gap-1 text-xs text-gray-700'>
              <span className='font-bold'>{comment.timestamp}</span>
              <span>By: {comment.author}</span>
            </div>
            <div className='text-sm mt-1'>{comment.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TupleCardRow: React.FC<{
  data: { title: string; value: React.ReactNode };
  isComponent?: boolean;
}> = ({ data, isComponent = false }) => {
  return (
    <div className='w-full grid grid-cols-2 p-2 text-xs border-b'>
      <div className='font-bold border-r'>{data.title}</div>
      <div className='pl-2'>
        {isComponent ? data.value : <span>{data.value}</span>}
      </div>
    </div>
  );
};

export default TaskViewPage;