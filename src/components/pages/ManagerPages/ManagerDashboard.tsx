import { NativeSelect } from "@chakra-ui/react";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import HomePageKanbanBoard from "../../ui/PublicUI/HomepageKanbanBoard";
import CalendarArea from "../../ui/PublicUI/CalendarArea";
import Progress from "../../ui/PublicUI/Progress";

type Project = { 
  id: number; 
  title: string;
  description?: string;
};

type Event = {
  id: number;
  title: string;
  date: string;
  time?: string;
};

type TaskCounts = {
  todo: number;
  in_progress: number;
  done: number;
  total: number;
};

const ManagerDashboard: React.FC = () => {
  // const navigate = useNavigate();

  // Dashboard stats
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [taskOverview, setTaskOverview] = useState<TaskCounts>({
    todo: 0,
    in_progress: 0,
    done: 0,
    total: 0
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [kanbanRefreshKey, setKanbanRefreshKey] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load all dashboard data in parallel
        const [projectsRes, eventsRes, tasksOverviewRes, upcomingEventsRes] = await Promise.all([
          // Get all projects
          fetch(`${import.meta.env.VITE_BASE_URL}/api/manager/projects/list.php`, {
            method: "GET",
            credentials: "include",
          }),
          
          // Get events overview
          fetch(`${import.meta.env.VITE_BASE_URL}/api/manager/events/event.php?action=overview`, {
            method: "GET",
            credentials: "include",
          }),
          
          // Get tasks overview
          fetch(`${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=overview`, {
            method: "GET",
            credentials: "include",
          }),
          
          // Get upcoming events (limit 5 for dashboard)
          fetch(`${import.meta.env.VITE_BASE_URL}/api/manager/events/event.php?action=upcoming&limit=5`, {
            method: "GET",
            credentials: "include",
          })
        ]);

        // Handle projects response
        const projectsJson = await projectsRes.json();
        if (projectsJson.success && projectsJson.projects) {
          setProjects(projectsJson.projects);
          setTotalProjects(projectsJson.projects.length);
          
          // Auto-select first project if none selected
          if (!selectedProject && projectsJson.projects.length > 0) {
            setSelectedProject(projectsJson.projects[0].id);
          }
        }

        // Handle events overview response
        const eventsJson = await eventsRes.json();
        console.log("eventsJson",eventsJson);
        if (eventsJson.success && eventsJson.overview) {
          // Assuming overview contains total count
          setTotalEvents(eventsJson.overview.total_events || 0);
        }

        // Handle tasks overview response
        const tasksJson = await tasksOverviewRes.json();
        console.log("tasksJson",tasksJson);
        if (tasksJson.success && tasksJson.overview) {
          const overview = tasksJson.overview;
          const taskCounts = {
            todo: overview.todo || 0,
            in_progress: overview.in_progress || 0,
            done: overview.done || 0,
            total: (overview.todo || 0) + (overview.in_progress || 0) + (overview.done || 0)
          };
          setTaskOverview(taskCounts);
          setTotalTasks(tasksJson.overview.total_tasks);
        }

        // Handle upcoming events response
        const upcomingJson = await upcomingEventsRes.json();
        if (upcomingJson.success && upcomingJson.events) {
          setUpcomingEvents(upcomingJson.events);
        }

      } catch (error: any) {
        console.error("Dashboard loading error:", error);
        setErr("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Load tasks for selected project
  useEffect(() => {
    if (selectedProject) {
      const loadProjectTasks = async () => {
        try {
          const tasksRes = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/manager/tasks/task.php?action=list&project_id=${selectedProject}`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          const tasksJson = await tasksRes.json();
          
          if (tasksJson.success && tasksJson.tasks) {
            // Count tasks by status for selected project
            const counts = tasksJson.tasks.reduce((acc: any, task: any) => {
              acc[task.status] = (acc[task.status] || 0) + 1;
              return acc;
            }, {});
            
            const projectTaskCounts = {
              todo: counts.todo || 0,
              in_progress: counts.in_progress || 0,
              done: counts.done || 0,
              total: tasksJson.tasks.length
            };
            setTaskOverview(projectTaskCounts);
          }
        } catch (error) {
          console.error("Error loading project tasks:", error);
        }
      };
      
      loadProjectTasks();
    }
  }, [selectedProject]);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center text-red-600 text-center">
        <div>
          <div className="text-xl mb-2">⚠️</div>
          <div>{err}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="min-w-[240px]">
          <ProjectSelector 
            items={projects} 
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
          />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <CountView 
            title="Total Projects" 
            count={totalProjects} 
            className="bg-blue-600 hover:bg-blue-700" 
          />
          <CountView 
            title="Total Events" 
            count={totalEvents} 
            className="bg-green-600 hover:bg-green-700" 
          />
          <CountView 
            title="Total Tasks" 
            count={totalTasks} 
            className="bg-purple-600 hover:bg-purple-700" 
          />
        </div>
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600">To Do</div>
          <div className="font-bold text-2xl text-yellow-600">{taskOverview.todo}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">In Progress</div>
          <div className="font-bold text-2xl text-blue-600">{taskOverview.in_progress}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">Completed</div>
          <div className="font-bold text-2xl text-green-600">{taskOverview.done}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
          <div className="text-sm font-medium text-gray-600">Total</div>
          <div className="font-bold text-2xl text-gray-600">{taskOverview.total}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Kanban Board */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Project Overview </h2>
            <HomePageKanbanBoard projectId={parseInt(selectedProject)}/>
          </div>
        </div>
      </div>
    </div>
  );
};

const CountView = ({ 
  className, 
  title, 
  count 
}: { 
  className?: string; 
  title: string; 
  count: number; 
}) => (
  <div className={clsx(
    "rounded-lg p-4 text-white shadow-sm transition-colors cursor-pointer",
    className
  )}>
    <div className="text-sm font-medium opacity-90">{title}</div>
    <div className="font-bold text-3xl">{count}</div>
  </div>
);

const ProjectSelector: React.FC<{ 
  items: Project[];
  selectedProject: number | null;
  onProjectChange: (projectId: number | null) => void;
}> = ({ items, selectedProject, onProjectChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onProjectChange(value ? parseInt(value) : null);
  };

  return (
    <div className="relative">
      <select 
        value={selectedProject || ""} 
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All Projects</option>
        {items.length === 0 && (
          <option value="" disabled>No projects found</option>
        )}
        {items.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ManagerDashboard;