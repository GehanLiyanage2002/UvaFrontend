// src/pages/manager/ManagerReportPage.tsx
import React, { useEffect, useState } from 'react';
import { FileText, Download, Trash2, RefreshCw } from 'lucide-react';
import { Box, Input } from '@chakra-ui/react';
import { LuSearch } from "react-icons/lu";
import { getAuth } from '../../../lib/api';

type Project = { id: number; title: string };
type Report = {
  id: number;
  project_id: number;
  project_name: string;
  filename: string;
  download_url: string;
  created_at: string;
};

const ManagerReportPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [loadingGen, setLoadingGen] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>('');
  const [err, setErr] = useState<string>('');

  // Load only THIS manager's projects
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingProjects(true);
        const auth = getAuth();
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/manager/projects/list.php`,
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
        try { data = JSON.parse(text); } catch { throw new Error('Projects API did not return JSON'); }
        if (!res.ok || !data?.success) throw new Error(data?.message || `Load projects failed (HTTP ${res.status})`);
        if (!alive) return;

        const list: Project[] = (data.projects ?? []).map((p: any) => ({
          id: Number(p.id),
          title: String(p.title ?? `Project #${p.id}`),
        }));
        setProjects(list);
        if (list.length && !selectedProjectId) setSelectedProjectId(String(list[0].id));
      } catch (e: any) {
        setErr(e?.message || 'Failed to load your projects.');
      } finally {
        if (alive) setLoadingProjects(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load previously generated reports (for this manager)
  const loadReports = async () => {
    try {
      setLoadingReports(true);
      setErr('');
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/pdf/list.php`,
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
      try { data = JSON.parse(text); } catch { throw new Error('Report list API did not return JSON'); }
      if (!res.ok || !data?.success) throw new Error(data?.message || `Load reports failed (HTTP ${res.status})`);

      const list: Report[] = (data.reports ?? []).map((r: any) => ({
        id: Number(r.id),
        project_id: Number(r.project_id),
        project_name: String(r.project_name ?? `Project #${r.project_id}`),
        filename: String(r.filename ?? 'report.pdf'),
        download_url: String(r.download_url ?? '#'),
        created_at: String(r.created_at || new Date().toISOString()),
      }));
      
      setReports(list);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load generated reports.');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filter reports based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report => 
        report.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [reports, searchTerm]);

  const handleGeneratePDF = async () => {
    setMsg('');
    setErr('');
    const pid = Number(selectedProjectId);
    if (!pid || pid <= 0) {
      setErr('Please select a valid project.');
      return;
    }

    try {
      setLoadingGen(true);
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/pdf/generate.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ project_id: pid }),
        }
      );

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('Generate API did not return JSON'); }

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed (HTTP ${res.status})`);
      }

      setMsg(data.message || 'PDF generated successfully.');
      
      // Reload reports to get the updated list from database
      await loadReports();
      
    } catch (e: any) {
      setErr(e?.message || 'Server error while generating PDF.');
    } finally {
      setLoadingGen(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      setDeletingReportId(reportId);
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/pdf/delete.php?report_id=${reportId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
        }
      );

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('Delete API did not return JSON'); }

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to delete report (HTTP ${res.status})`);
      }

      setMsg('Report deleted successfully.');
      // Remove from local state
      setReports(prev => prev.filter(r => r.id !== reportId));
      
    } catch (e: any) {
      setErr(e?.message || 'Failed to delete report.');
    } finally {
      setDeletingReportId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className='flex flex-col gap-6 pb-4'>
      <div className='flex justify-between'>
        <div>
          <div className='font-bold text-3xl flex gap-2 items-center'>
            <FileText size={30} />
            Reports
          </div>
          <div className='text text-xs'>Access project reports and Gantt charts</div>
        </div>

        <div className='flex gap-3 items-center'>
          <button
            onClick={loadReports}
            disabled={loadingReports}
            className='p-2 border rounded hover:bg-gray-50 disabled:opacity-50'
            title="Refresh reports"
          >
            <RefreshCw size={16} className={loadingReports ? 'animate-spin' : ''} />
          </button>
          
          <Box position="relative" width="200px" border="1px solid #CBD5E0" borderRadius="md">
            <Box position="absolute" top="50%" left="8px" transform="translateY(-50%)" zIndex="10">
              <LuSearch size={16} color="gray" />
            </Box>
            <Input
              type="text"
              placeholder="Search Reports"
              pl="30px"
              size="xs"
              border="none"
              borderRadius="md"
              fontSize={'xs'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
        </div>
      </div>


      {/* Any status/errors */}
      {msg && (
        <div className='text-xs text-green-800 border border-green-300 rounded p-2 bg-green-50'>
          {msg}
        </div>
      )}
      {err && (
        <div className='text-xs text-red-800 border border-red-300 rounded p-2 bg-red-50'>
          {err}
        </div>
      )}

      {/* Table: generated reports */}
      <div className='flex flex-col border rounded-md'>
        <div className='grid grid-cols-5 font-bold text-sm bg-gray-100 p-2 border-b'>
          <div className='pl-1'>Project Name</div>
          <div className='pl-2'>Report File</div>
          <div className='pl-2'>Generated</div>
          <div className='pl-2'>Download</div>
          <div className='pl-2'>Actions</div>
        </div>

        {loadingReports && (
          <>
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className='grid grid-cols-5 text-xs p-2 border-b opacity-60'>
                <div className='pl-1'>Loading…</div>
                <div className='pl-2'>Loading…</div>
                <div className='pl-2'>Loading…</div>
                <div className='pl-2'>Loading…</div>
                <div className='pl-2'>Loading…</div>
              </div>
            ))}
          </>
        )}

        {!loadingReports && filteredReports.length === 0 && !searchTerm && (
          <div className='text-xs p-4 text-center text-gray-500'>
            No reports generated yet. Generate your first project report above.
          </div>
        )}

        {!loadingReports && filteredReports.length === 0 && searchTerm && (
          <div className='text-xs p-4 text-center text-gray-500'>
            No reports found matching "{searchTerm}".
          </div>
        )}

        {!loadingReports && filteredReports.length > 0 && filteredReports.map((r) => (
          <div key={r.id} className='grid grid-cols-5 text-xs p-2 border-b hover:bg-gray-50 transition'>
            <div className='pl-1 flex items-center'>
              <span className='font-medium'>{r.project_name}</span>
              <span className='text-gray-500 ml-1'>(#{r.project_id})</span>
            </div>
            <div className='pl-2 flex items-center'>{r.filename}</div>
            <div className='pl-2 flex items-center text-gray-600'>
              {formatDate(r.created_at)}
            </div>
            <div className='pl-2 flex items-center'>
              {r.download_url ? (
                <a
                  href={r.download_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1 underline text-blue-700 hover:text-blue-900'
                >
                  <Download size={12} />
                  Download
                </a>
              ) : (
                <span className='text-gray-500'>N/A</span>
              )}
            </div>
            <div className='pl-2 flex items-center'>
              <button
                onClick={() => handleDeleteReport(r.id)}
                disabled={deletingReportId === r.id}
                className='inline-flex items-center gap-1 text-red-600 hover:text-red-800 disabled:opacity-50'
                title="Delete report"
              >
                <Trash2 size={12} />
                {deletingReportId === r.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show total count */}
      {!loadingReports && reports.length > 0 && (
        <div className='text-xs text-gray-500 text-right'>
          {searchTerm ? `${filteredReports.length} of ${reports.length} reports` : `${reports.length} total reports`}
        </div>
      )}
    </div>
  );
};

export default ManagerReportPage;