import React, { useState, useEffect } from 'react';
import { AppWindow, X, Loader2, AlertCircle } from 'lucide-react';
import { getAuth } from '../../../lib/api';

interface Project {
  id: number;
  title: string;
  description?: string;
  todo_count: number;
  in_progress_count: number;
  done_count: number;
  testing_count: number;
  supervisors: string | null;
  [key: string]: any;
}

interface Supervisor {
  id: number;
  full_name: string;
  email: string;
  type: string;
  faculty_name?: string;
  department_name?: string;
  [key: string]: any;
}

interface Assignment {
  supervisorId: number;
  supervisorName: string;
  supervisorEmail: string;
  supervisorType: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  tasks?: Project[];
  supervisors?: Supervisor[];
  [key: string]: any;
}

const CoordinatorProjectListPage: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [assignments, setAssignments] = useState<Record<number, Assignment>>({});
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  // Fetch projects from API
  const fetchProjects = async (): Promise<void> => {
    try {
      const auth = getAuth();
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/coordinator/projects/project.php?action=list`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
        }
      );

      const text = await response.text();
      let data: ApiResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Load failed (HTTP ${response.status})`);
      }

      setProjects(data.tasks || []); // API returns 'tasks' according to documentation
      
      // Initialize assignments from API data
      const initialAssignments: Record<number, Assignment> = {};
      data.tasks?.forEach((project: Project) => {
        if (project.supervisors) {
          // Find supervisor details by name
          const supervisor = supervisors.find(s => s.full_name === project.supervisors);
          if (supervisor) {
            initialAssignments[project.id] = {
              supervisorId: supervisor.id,
              supervisorName: supervisor.full_name,
              supervisorEmail: supervisor.email,
              supervisorType: supervisor.type,
            };
          } else {
            // If supervisor not found in supervisors list, still show the name
            initialAssignments[project.id] = {
              supervisorId: project.supervisor_id,
              supervisorName: project.supervisors,
              supervisorEmail: '',
              supervisorType: '',
            };
          }
        }
      });
      setAssignments(initialAssignments);
    } catch (err: any) {
      throw new Error(`Failed to load projects: ${err.message}`);
    }
  };

  // Fetch supervisors from API
  const fetchSupervisors = async (): Promise<void> => {
    try {
      const auth = getAuth();
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/coordinator/supervisors/supervisor.php?action=list`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
        }
      );

      const text = await response.text();
      let data: ApiResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Load failed (HTTP ${response.status})`);
      }

      setSupervisors(data.supervisors || []);
    } catch (err: any) {
      throw new Error(`Failed to load supervisors: ${err.message}`);
    }
  };

  // Unassign supervisor from project
  const unassignSupervisorFromProject = async (projectId: number, supervisorId: number): Promise<ApiResponse> => {
    console.log(`Unassigning supervisor ${supervisorId} from project ${projectId}`);
    try {
      const auth = getAuth();
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/coordinator/supervisors/supervisor.php?action=unassign-from-project`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            project_id: projectId,
            supervisor_id: supervisorId,
          }),
        }
      );

      const text = await response.text();
      let data: ApiResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Unassignment failed (HTTP ${response.status})`);
      }

      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Server error while unassigning supervisor');
    }
  };

  // Assign supervisor to project
  const assignSupervisorToProject = async (projectId: number, supervisorId: number): Promise<ApiResponse> => {
    try {
      const auth = getAuth();
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/coordinator/supervisors/supervisor.php?action=assign-to-project`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            project_id: projectId,
            supervisor_id: supervisorId,
          }),
        }
      );

      const text = await response.text();
      let data: ApiResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API did not return JSON');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Assignment failed (HTTP ${response.status})`);
      }

      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Server error while assigning supervisor');
    }
  };

  // Load data on component mount
  useEffect(() => {
    let alive = true;
    
    const loadData = async (): Promise<void> => {
      setLoading(true);
      setError('');
      
      try {
        // First load supervisors, then projects (so we can match supervisor names to IDs)
        await fetchSupervisors();
        await fetchProjects();
      } catch (err: any) {
        if (alive) setError(err.message || 'Failed to load data');
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const handleOpenModal = (projectId: number): void => {
    setSelectedProjectId(projectId);
    const currentAssignment = assignments[projectId];
    setSelectedSupervisorId(currentAssignment?.supervisorId || null);
    setShowModal(true);
  };

  const handleAssign = async (): Promise<void> => {
    if (!selectedProjectId || !selectedSupervisorId) return;

    setAssigning(true);
    setError('');
    
    try {
      // Assign supervisor to project
      await assignSupervisorToProject(selectedProjectId, selectedSupervisorId);

      // Update local assignments state
      const supervisor = supervisors.find((s) => s.id === selectedSupervisorId);

      setAssignments(prev => ({
        ...prev,
        [selectedProjectId]: {
          supervisorId: supervisor?.id || 0,
          supervisorName: supervisor?.full_name || '',
          supervisorEmail: supervisor?.email || '',
          supervisorType: supervisor?.type || '',
        }
      }));

      setShowModal(false);
      
      // Reset form
      setSelectedSupervisorId(null);
      
      // Refresh projects to get updated supervisor assignments
      await fetchProjects();
      
    } catch (err: any) {
      setError(err.message || 'Failed to assign supervisor');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (projectId: number, supervisorId: number): Promise<void> => {
    const assignment = assignments[projectId];
    const project = projects.find(p => p.id === projectId);
    
    // Check if there's actually a supervisor assigned (either from local state or API data)
    if (!assignment?.supervisorName && !project?.supervisors) return;

    setAssigning(true);
    setError('');
    
    try {
      // Call API to unassign supervisor (only need project_id)
      await unassignSupervisorFromProject(projectId, supervisorId);

      // Remove from local assignments state
      setAssignments(prev => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
      
      // Refresh projects to get updated data
      await fetchProjects();
      
    } catch (err: any) {
      setError(err.message || 'Failed to unassign supervisor');
    } finally {
      setAssigning(false);
    }
  };

  // Get all supervisors (no filtering needed since co-supervisor is removed)
  const getAllSupervisors = (): Supervisor[] => {
    return supervisors;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading projects and supervisors...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="flex items-center gap-2 text-red-600 text-sm border border-red-300 rounded p-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 pb-4 px-4'>
      <div className='flex justify-between items-center'>
        <div>
          <div className='font-bold text-3xl flex gap-2 items-center'>
            <AppWindow size={30} />
            Projects
          </div>
          <div className='text-xs text-gray-500'>Assign supervisors to available student projects.</div>
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No projects available
          </div>
        ) : (
          projects.map((project) => {
            // Check both local assignments and project.supervisors from API
            const assigned = assignments[project.id] || (project.supervisors ? {
              supervisorId: 0,
              supervisorName: project.supervisors,
              supervisorEmail: '',
              supervisorType: ''
            } : null);
            
            return (
              <div key={project.id} className='rounded-md bg-[#E8F5E9] p-4 shadow-sm hover:shadow-md transition'>
                <div className='flex justify-between items-center'>
                  <div>
                    <div className='font-bold text-lg'>{project.title}</div>
                    <div className='text-xs text-gray-500'>Click below to assign a supervisor</div>
                    {project.description && (
                      <div className='text-sm text-gray-600 mt-1'>{project.description}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(project.id)}
                      className="bg-green-800 text-white px-4 py-1 rounded-md text-sm hover:bg-green-900 disabled:opacity-50"
                      disabled={assigning}
                    >
                      {assigned ? 'Update Assignment' : 'Assign Supervisor'}
                    </button>
                  </div>
                </div>
                {assigned && (
                  <div className="mt-3 text-sm text-gray-700 bg-white rounded p-3 shadow-inner">
                    <div className="flex justify-between items-center">
                      <div><strong>Supervisor:</strong> {assigned.supervisorName}</div>
                      <button
                        onClick={() => handleUnassign(project.id,assigned.supervisorId)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                        disabled={assigning}
                      >
                        {assigning ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-xl p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowModal(false)}
              disabled={assigning}
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-black">
              {assignments[selectedProjectId!] ? 'Update Supervisor Assignment' : 'Assign Supervisor'}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <select
                className="border p-2 rounded"
                value={selectedSupervisorId || ''}
                onChange={(e) => setSelectedSupervisorId(Number(e.target.value))}
                disabled={assigning}
              >
                <option value="">Select Supervisor *</option>
                {getAllSupervisors().map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.full_name} - {sup.faculty_name} ({sup.department_name})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm border border-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={handleAssign} 
                className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={!selectedSupervisorId || assigning}
              >
                {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
                {assigning ? 'Assigning...' : 'Save Assignment'}
              </button>
              <button 
                onClick={() => setShowModal(false)} 
                className="border border-green-800 text-green-800 px-4 py-2 rounded text-sm hover:bg-green-800 hover:text-white disabled:opacity-50"
                disabled={assigning}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorProjectListPage;