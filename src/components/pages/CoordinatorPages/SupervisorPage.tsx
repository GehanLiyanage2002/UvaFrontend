import React, { useState, useEffect } from 'react';
import { Users, Pencil, Trash2, Plus, X } from 'lucide-react';
import { getAuth } from '../../../lib/api'; // Assuming you have this for auth

type Supervisor = {
  id: number;
  full_name: string;
  email: string;
  contact: string;
  faculty_name: string;
  department_name: string;
  about: string;
  type: string;
  created_at?: string;
  updated_at?: string;
  image?: string;
};

const SupervisorPage: React.FC = () => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<null | number>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    contact: '',
    type: 'supervisor',
    faculty_name: '',
    department_name: '',
    about: '',
  });

  // Fetch supervisors from API
  const fetchSupervisors = async () => {
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const res = await fetch(
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

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON from supervisors API:\n', text);
        throw new Error('API did not return JSON');
      }

      if (data?.success && data?.supervisors) {
        const fetchedSupervisors: Supervisor[] = data.supervisors.map((item: any) => ({
          ...item,
          image: `https://ui-avatars.com/api/?name=${item.full_name?.replace(/\s+/g, '+')}&background=34d399&color=fff`
        }));
        setSupervisors(fetchedSupervisors);
      } else {
        setError(data?.message || 'Failed to load supervisors');
      }
    } catch (e: any) {
      console.error('Fetch supervisors error:', e);
      setError('Server error while loading supervisors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const openNew = () => {
    setEditMode(null);
    setForm({
      full_name: '',
      email: '',
      contact: '',
      type: 'supervisor',
      faculty_name: '',
      department_name: '',
      about: '',
    });
    setShowModal(true);
  };

  const openEdit = (supervisor: Supervisor) => {
    setEditMode(supervisor.id);
    setForm({
      full_name: supervisor.full_name,
      email: supervisor.email,
      contact: supervisor.contact,
      type: supervisor.type,
      faculty_name: supervisor.faculty_name,
      department_name: supervisor.department_name,
      about: supervisor.about,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.faculty_name || !form.department_name) {
      setError('Name, email, faculty, and department are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const auth = getAuth();
      const url = editMode 
        ? `${import.meta.env.VITE_BASE_URL}/api/coordinator/supervisors/supervisor.php?action=update`
        : `${import.meta.env.VITE_BASE_URL}/api/coordinator/supervisors/supervisor.php?action=create`;

      const body = editMode 
        ? { id: editMode, ...form }
        : form;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON response:', text);
        throw new Error('API did not return JSON');
      }

      if (data?.success) {
        setForm({
          full_name: '',
          email: '',
          contact: '',
          type: 'supervisor',
          faculty_name: '',
          department_name: '',
          about: '',
        });
        setShowModal(false);
        setEditMode(null);
        // Refresh supervisors list
        fetchSupervisors();
      } else {
        setError(data?.message || 'Failed to save supervisor');
      }
    } catch (e: any) {
      console.error('Submit error:', e);
      setError('Server error while saving supervisor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supervisor?')) return;

    try {
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/coordinator/supervisors/supervisor.php?action=delete&id=${id}`,
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
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON response:', text);
        throw new Error('API did not return JSON');
      }

      if (data?.success) {
        setSupervisors((prev) => prev.filter((s) => s.id !== id));
      } else {
        setError(data?.message || 'Failed to delete supervisor');
      }
    } catch (e: any) {
      console.error('Delete error:', e);
      setError('Server error while deleting supervisor.');
    }
  };

  const renderCard = (sup: Supervisor) => (
    <div
      key={sup.id}
      className="bg-green-50 rounded-xl shadow p-4 relative transition-all duration-300 hover:shadow-lg group"
    >
      <div className="flex items-center gap-4">
        <img 
          src={sup.image} 
          alt={sup.full_name} 
          className="w-12 h-12 rounded-md object-cover border" 
        />
        <div>
          <div className="font-semibold text-sm text-gray-800">{sup.full_name}</div>
          <div className="text-xs text-gray-600">{sup.email}</div>
        </div>
      </div>

      <div className="hidden group-hover:block mt-3 bg-white rounded-md p-3 text-xs text-gray-700 shadow-inner">
        <div className="font-bold text-sm text-gray-800 mb-1">{sup.full_name}</div>
        <div><b>Email:</b> {sup.email}</div>
        <div><b>Phone:</b> {sup.contact || 'N/A'}</div>
        <div><b>Faculty:</b> {sup.faculty_name}</div>
        <div><b>Department:</b> {sup.department_name}</div>
        <div><b>About:</b> {sup.about || 'No description available'}</div>
      </div>

      <div className="flex gap-2 justify-end mt-3">
        <button 
          onClick={() => openEdit(sup)}
          className="text-xs border border-black text-black px-2 py-1 rounded flex items-center gap-1 hover:bg-black hover:text-white"
        >
          <Pencil size={14} /> Edit
        </button>
        <button
          onClick={() => handleDelete(sup.id)}
          className="text-xs border border-black text-black px-2 py-1 rounded flex items-center gap-1 hover:bg-black hover:text-white"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-4 px-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold text-3xl flex gap-2 items-center">
            <Users className="text-black w-6 h-6" /> Supervisors
          </div>
          <div className="text-xs text-gray-500">List of project supervisors.</div>
        </div>
        <button
          onClick={openNew}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-gray-800"
        >
          <Plus size={16} /> Add Supervisor
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 border border-red-300 rounded p-2 bg-red-50">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-300 rounded-md"></div>
                <div>
                  <div className="bg-gray-300 h-4 w-24 rounded mb-1"></div>
                  <div className="bg-gray-300 h-3 w-32 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && supervisors.length === 0 && (
        <div className="text-gray-500 text-center py-8">
          No supervisors found. Click "Add Supervisor" to get started.
        </div>
      )}

      {/* Supervisors Grid */}
      {!loading && supervisors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {supervisors.map(renderCard)}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-black">
              {editMode ? 'Edit Supervisor' : 'Add Supervisor'}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                className="border p-2 rounded" 
                placeholder="Full Name *" 
                value={form.full_name} 
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                disabled={submitting}
              />
              <input 
                className="border p-2 rounded" 
                placeholder="Email *" 
                type="email"
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={submitting}
              />
              <input 
                className="border p-2 rounded" 
                placeholder="Contact" 
                value={form.contact} 
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                disabled={submitting}
              />
              <select 
                className="border p-2 rounded" 
                value={form.type} 
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={submitting}
              >
                <option value="supervisor">Supervisor</option>
              </select>
              <input 
                className="border p-2 rounded" 
                placeholder="Faculty *" 
                value={form.faculty_name} 
                onChange={(e) => setForm({ ...form, faculty_name: e.target.value })}
                disabled={submitting}
              />
              <input 
                className="border p-2 rounded" 
                placeholder="Department *" 
                value={form.department_name} 
                onChange={(e) => setForm({ ...form, department_name: e.target.value })}
                disabled={submitting}
              />
              <textarea 
                className="border p-2 rounded col-span-full" 
                placeholder="About (optional)" 
                value={form.about} 
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                disabled={submitting}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={handleSubmit} 
                className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (editMode ? 'Update' : 'Save')}
              </button>
              <button 
                onClick={() => setShowModal(false)} 
                className="border border-black text-black px-4 py-2 rounded text-sm hover:bg-black hover:text-white disabled:opacity-50"
                disabled={submitting}
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

export default SupervisorPage;