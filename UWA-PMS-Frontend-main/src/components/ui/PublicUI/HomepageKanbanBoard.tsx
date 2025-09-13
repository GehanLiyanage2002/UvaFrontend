import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { X, Edit, Trash2, UserPlus, UserMinus, Loader2 } from 'lucide-react';

type LaneType = 'todo' | 'in_progress' | 'done';

interface Task {
  id: number;
  project_id: number;
  title: string;
  status: LaneType;
  created_at: string;
  assigned_users?: AssignedUser[];
}

interface AssignedUser {
  id: string;
  name: string;
  email: string;
  user_name:string;
  user_id:string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  
}

interface ApiResponse {
  success: boolean;
  tasks: Task[];
}

const cardStyles: Record<LaneType, { bg: string; border: string }> = {
  todo: { bg: 'bg-yellow-50', border: 'border-l-yellow-400' },
  in_progress: { bg: 'bg-blue-50', border: 'border-l-blue-500' },
  done: { bg: 'bg-green-50', border: 'border-l-green-500' },
};

const laneLabels: Record<LaneType, string> = {
  todo: 'TODO',
  in_progress: 'In Progress',
  done: 'Done',
};

interface KanbanBoardProps {
  projectId?: string | number;
}

const HomePageKanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const [columns, setColumns] = useState<Record<LaneType, Task[]>>({
    todo: [],
    in_progress: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task Edit Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', status: '' });
  const [savingTask, setSavingTask] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);

  // Member Assignment State
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const [unassigningUser, setUnassigningUser] = useState<string | null>(null);

  const lanes: LaneType[] = ['todo', 'in_progress', 'done'];

  // Fetch tasks from API
  const fetchTasks = async () => {
    if (!projectId) {
      setError('Project ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const url = `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=list&project_id=${encodeURIComponent(projectId)}`;
      const response = await fetch(url, { credentials: 'include' });
      
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`API did not return JSON. Response: ${text.substring(0, 100)}...`);
      }
      
      if (data?.success) {
        if (data?.tasks && Array.isArray(data.tasks)) {
          // Group tasks by status and fetch assignments for each
          const groupedTasks: Record<LaneType, Task[]> = {
            todo: [],
            in_progress: [],
            done: [],
          };
          
          const tasksWithAssignments = await Promise.all(
            data.tasks.map(async (task: Task) => {
              const assignments = await fetchTaskAssignments(task.id);
              return { ...task, assigned_users: assignments };
            })
          );
          
          tasksWithAssignments.forEach((task: Task) => {
            if (groupedTasks[task.status]) {
              groupedTasks[task.status].push(task);
            }
          });
          
          setColumns(groupedTasks);
        } else {
          setColumns({ todo: [], in_progress: [], done: [] });
        }
      } else {
        setError(data?.message || 'Failed to load tasks');
      }
    } catch (err: any) {
      console.error('Fetch tasks error:', err);
      setError(err?.message || 'Server error while loading tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch task assignments
  const fetchTaskAssignments = async (taskId: number): Promise<AssignedUser[]> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=assignments&project_id=${projectId}&task_id=${taskId}`,
        { credentials: 'include' }
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.warn(`Failed to parse assignments for task ${taskId}`);
        return [];
      }

      if (data?.success && data?.assignments) {
        return data.assignments;
      }
      return [];
    } catch (err: any) {
      console.warn(`Failed to fetch assignments for task ${taskId}:`, err);
      return [];
    }
  };

  // Fetch available members
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/members/member.php?action=list`,
        { credentials: 'include' }
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (data?.success && data?.data) {
        setAvailableMembers(data.data);
      }
    } catch (err: any) {
      console.error('Fetch members error:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Update task status via drag and drop
  const updateTaskStatus = async (taskId: number, newStatus: LaneType) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=update-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            project_id: projectId,
            id: taskId,
            status: newStatus,
          }),
        }
      );
      
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }
      
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Update failed (HTTP ${response.status})`);
      }
    } catch (err: any) {
      console.error('Update task status error:', err);
      // Refresh tasks to revert any optimistic updates
      fetchTasks();
    }
  };

  // Handle task click to open modal
  const handleTaskClick = (task: Task, event: React.MouseEvent) => {
    // Prevent opening modal if drag is in progress
    if ((event.target as HTMLElement).closest('[data-rbd-drag-handle-draggable-id]')) {
      return;
    }
    
    setSelectedTask(task);
    setEditForm({ title: task.title, status: task.status });
    setShowTaskModal(true);
    fetchMembers();
  };

  // Close task modal
  const closeTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
    setEditForm({ title: '', status: '' });
    setAvailableMembers([]);
    setError('');
  };

  // Save task changes
  const handleSaveTask = async () => {
    if (!selectedTask || !editForm.title.trim()) {
      setError('Task title is required.');
      return;
    }

    try {
      setSavingTask(true);
      setError('');

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            project_id: selectedTask.project_id,
            id: selectedTask.id,
            title: editForm.title.trim(),
            status: editForm.status,
          }),
        }
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Update failed (HTTP ${response.status})`);
      }

      // Refresh tasks and close modal
      await fetchTasks();
      closeTaskModal();
      alert('Task updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Server error while updating task.');
    } finally {
      setSavingTask(false);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    const confirmed = window.confirm(`Delete task "${selectedTask.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingTask(true);
      setError('');

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=delete&project_id=${selectedTask.project_id}&id=${selectedTask.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Delete failed (HTTP ${response.status})`);
      }

      // Refresh tasks and close modal
      await fetchTasks();
      closeTaskModal();
      alert('Task deleted successfully!');
    } catch (err: any) {
      setError(err?.message || 'Server error while deleting task.');
    } finally {
      setDeletingTask(false);
    }
  };

  // Assign user to task
  const handleAssignUser = async (userId: string) => {
    if (!selectedTask) return;

    try {
      setAssigningUser(userId);
      setError('');

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=assign-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            project_id: selectedTask.project_id,
            task_id: selectedTask.id,
            user_id: userId,
          }),
        }
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Assignment failed (HTTP ${response.status})`);
      }

      // Refresh tasks to update assigned users
      await fetchTasks();
      
      // Update selected task with refreshed data
      if (selectedTask) {
        const updatedAssignments = await fetchTaskAssignments(selectedTask.id);
        setSelectedTask(prev => prev ? { ...prev, assigned_users: updatedAssignments } : null);
      }
      
      alert('User assigned successfully!');
    } catch (err: any) {
      setError(err?.message || 'Server error while assigning user.');
    } finally {
      setAssigningUser(null);
    }
  };

  // Unassign user from task
  const handleUnassignUser = async (userId: string) => {
    if (!selectedTask) return;

    try {
      setUnassigningUser(userId);
      setError('');

      console.log(JSON.stringify({
        project_id: selectedTask.project_id,
        task_id: selectedTask.id,
        user_id: userId,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=unassign-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            project_id: selectedTask.project_id,
            task_id: selectedTask.id,
            user_id: userId,
          }),
        }
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Unassignment failed (HTTP ${response.status})`);
      }

      // Refresh tasks to update assigned users
      await fetchTasks();
      
      // Update selected task with refreshed data
      if (selectedTask) {
        const updatedAssignments = await fetchTaskAssignments(selectedTask.id);
        setSelectedTask(prev => prev ? { ...prev, assigned_users: updatedAssignments } : null);
      }
      
      alert('User unassigned successfully!');
    } catch (err: any) {
      setError(err?.message || 'Server error while unassigning user.');
    } finally {
      setUnassigningUser(null);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    } else {
      setLoading(false);
      setError('No project ID provided');
    }
  }, [projectId]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceColumn = columns[source.droppableId as LaneType];
    const destColumn = columns[destination.droppableId as LaneType];
    const sourceTasks = [...sourceColumn];
    const destTasks = [...destColumn];
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // Moving within the same column
      sourceTasks.splice(destination.index, 0, movedTask);
      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: sourceTasks,
      }));
    } else {
      // Moving between different columns
      const updatedTask = { ...movedTask, status: destination.droppableId as LaneType };
      destTasks.splice(destination.index, 0, updatedTask);
      
      // Optimistically update the UI
      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: sourceTasks,
        [destination.droppableId]: destTasks,
      }));

      // Update the task status via API
      await updateTaskStatus(movedTask.id, destination.droppableId as LaneType);
    }
  };

  // Get available members for assignment (not already assigned)
  const getAvailableMembers = () => {
    const assignedUserIds = new Set(selectedTask?.assigned_users?.map(u => u.id) || []);
    return availableMembers.filter(member => !assignedUserIds.has(member.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lanes.map((lane) => (
            <Droppable droppableId={lane} key={lane}>
              {(provided) => (
                <div
                  className="rounded-md shadow min-h-[300px] flex flex-col bg-gray-100"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="p-3 font-semibold text-sm text-white bg-cyan-600 rounded-t-md text-center">
                    {laneLabels[lane]} ({columns[lane].length})
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {columns[lane].map((task, index) => (
                      <Draggable draggableId={task.id.toString()} index={index} key={task.id}>
                        {(provided) => (
                          <div
                            className={`border-l-4 ${cardStyles[lane].bg} ${cardStyles[lane].border} rounded-md p-3 shadow text-sm hover:shadow-md transition-shadow cursor-pointer`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={(e) => handleTaskClick(task, e)}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="font-bold text-gray-800">{task.title}</div>
                              <div className="text-gray-500 text-xs">
                                Created: {new Date(task.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-gray-400 text-xs">ID: {task.id}</div>
                              {task.assigned_users && task.assigned_users.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <div className="text-xs font-semibold text-gray-600">Assigned to:</div>
                                  {task.assigned_users.map((user, index) => (
                                    <div key={user.id} className="flex items-center justify-between bg-white bg-opacity-50 rounded px-2 py-1">
                                      <span className="text-xs ">
                                        {user.user_name}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent task modal from opening
                                          // handleQuickUnassignUser(task, user.id, user.name);
                                        }}
                                        className="text-red-500 hover:text-red-700 ml-1"
                                        title={`Remove ${user.user_name}`}
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
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

      {/* Task Edit Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Edit Task</h2>
              <button
                onClick={closeTaskModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={savingTask || deletingTask}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 border border-red-300 rounded p-2 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Task Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Task Details</h3>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Title *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={savingTask || deletingTask}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={savingTask || deletingTask}
                  >
                    <option value="todo">TODO</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              {/* Assigned Users */}
              <div className="space-y-4">
                <h3 className="font-semibold">Assigned Users</h3>
                
                {selectedTask.assigned_users && selectedTask.assigned_users.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTask.assigned_users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{user.user_name}</span>
                        <button
                          onClick={() => handleUnassignUser(user.user_id)}
                          disabled={unassigningUser === user.user_id}
                          className="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          {unassigningUser === user.id ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <UserMinus size={14} />
                          )}
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No users assigned</div>
                )}

                {/* Assign New Users */}
                {loadingMembers ? (
                  <div className="text-sm text-gray-500">Loading available members...</div>
                ) : (
                  <>
                    {getAvailableMembers().length > 0 ? (
                      <div>
                        <label className="block text-sm font-bold mb-2">Assign User</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {getAvailableMembers().map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{member.name} ({member.email})</span>
                              <button
                                onClick={() => handleAssignUser(member.id)}
                                disabled={assigningUser === member.id}
                                className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                {assigningUser === member.id ? (
                                  <Loader2 className="animate-spin" size={14} />
                                ) : (
                                  <UserPlus size={14} />
                                )}
                                Assign
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">All available members are already assigned</div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveTask}
                  disabled={!editForm.title.trim() || savingTask || deletingTask}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTask ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Edit size={16} />
                  )}
                  {savingTask ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  onClick={handleDeleteTask}
                  disabled={savingTask || deletingTask}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingTask ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {deletingTask ? 'Deleting...' : 'Delete Task'}
                </button>

                <button
                  onClick={closeTaskModal}
                  disabled={savingTask || deletingTask}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePageKanbanBoard;