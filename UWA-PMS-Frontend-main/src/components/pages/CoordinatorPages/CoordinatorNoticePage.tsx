import React, { useState, useEffect } from 'react';
import { Bell, EyeOff, CheckCircle, Pencil, Trash2, Plus, X } from 'lucide-react';
import { getAuth } from '../../../lib/api'; // Assuming you have this for auth

type Notice = {
  id: number;
  title: string;
  content: string;
  timeAgo: string;
  isNew: boolean;
  priority?: string;
  status?: string;
  expires_at?: string;
  is_public?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
};

// Utility to calculate time ago (e.g., "1 week ago", "3 days ago")
const timeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const CoordinatorNoticePage = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<null | number>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    content: '', 
    priority: 'normal',
    status: 'active',
    expires_at: '',
    is_public: true
  });

  // Fetch notices from API
  const fetchNotices = async () => {
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/coordinator/notices/notice.php?action=list&status=active`,
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
        console.error('Non-JSON from notices API:\n', text);
        throw new Error('API did not return JSON');
      }

      if (data?.success && data?.data) {
        const fetchedNotices: Notice[] = data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          timeAgo: timeAgo(item.updated_at || item.created_at),
          isNew: new Date(item.updated_at || item.created_at).getTime() > new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
          priority: item.priority,
          status: item.status,
          expires_at: item.expires_at,
          is_public: item.is_public,
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        setNotices(fetchedNotices);
      } else {
        setError(data?.message || 'Failed to load notices');
      }
    } catch (e: any) {
      console.error('Fetch notices error:', e);
      setError('Server error while loading notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const openNew = () => {
    setEditMode(null);
    setForm({ 
      title: '', 
      content: '', 
      priority: 'normal',
      status: 'active',
      expires_at: '',
      is_public: true
    });
    setShowModal(true);
  };

  const openEdit = (notice: Notice) => {
    setEditMode(notice.id);
    setForm({ 
      title: notice.title, 
      content: notice.content,
      priority: notice.priority || 'normal',
      status: notice.status || 'active',
      expires_at: notice.expires_at || '',
      is_public: notice.is_public !== undefined ? notice.is_public : true
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      setError('Title and content are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const auth = getAuth();
      const url = editMode 
        ? `${import.meta.env.VITE_BASE_URL}/api/coordinator/notices/notice.php?action=update`
        : `${import.meta.env.VITE_BASE_URL}/api/coordinator/notices/notice.php?action=create`;

      const body = editMode 
        ? { 
            id: editMode, 
            ...form,
            is_public: form.is_public ? 1 : 0
          }
        : { 
            ...form,
            is_public: form.is_public ? 1 : 0
          };

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
          title: '', 
          content: '', 
          priority: 'normal',
          status: 'active',
          expires_at: '',
          is_public: true
        });
        setShowModal(false);
        setEditMode(null);
        // Refresh notices list
        fetchNotices();
      } else {
        setError(data?.message || 'Failed to save notice');
      }
    } catch (e: any) {
      console.error('Submit error:', e);
      setError('Server error while saving notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/coordinator/notices/notice.php?action=delete&id=${id}`,
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
        setNotices((prev) => prev.filter((n) => n.id !== id));
      } else {
        setError(data?.message || 'Failed to delete notice');
      }
    } catch (e: any) {
      console.error('Delete error:', e);
      setError('Server error while deleting notice.');
    }
  };

  const markAsRead = (id: number) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isNew: false } : n))
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-4 px-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold text-3xl flex gap-2 items-center">
            <Bell size={30} /> Notices
          </div>
          <div className="text-xs text-gray-500">
            Stay updated with the latest announcements and reminders
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-black text-white rounded hover:bg-gray-900"
        >
          <Plus size={16} /> New Notice
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
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 p-4 rounded-md shadow-sm opacity-50">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-800 text-base">Loading...</p>
              </div>
              <p className="text-xs text-gray-700 mt-1">Loading content...</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && notices.length === 0 && (
        <div className="text-gray-500 text-center py-4">No notices available.</div>
      )}

      {/* Notices List */}
      {!loading && notices.length > 0 && (
        <div className="flex flex-col gap-3">
          {notices.map((note) => (
            <NoticeCard
              key={note.id}
              data={note}
              onMark={() => markAsRead(note.id)}
              onEdit={() => openEdit(note)}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-black">
              {editMode ? 'Edit Notice' : 'New Notice'}
            </h2>
            
            <div className="space-y-3">
              <input
                className="border p-2 w-full rounded"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={submitting}
              />
              
              <textarea
                className="border p-2 w-full h-28 rounded resize-none"
                placeholder="Content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                disabled={submitting}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="border p-2 rounded"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  disabled={submitting}
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
                
                <select
                  className="border p-2 rounded"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  disabled={submitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <input
                type="datetime-local"
                className="border p-2 w-full rounded"
                placeholder="Expires at (optional)"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                disabled={submitting}
              />
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                  disabled={submitting}
                />
                <span className="text-sm">Public notice</span>
              </label>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleSubmit}
                className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (editMode ? 'Update' : 'Publish')}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="border border-black px-4 py-2 rounded text-black hover:bg-black hover:text-white disabled:opacity-50"
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

const NoticeCard = ({
  data,
  onMark,
  onEdit,
  onDelete,
}: {
  data: Notice;
  onMark: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="bg-gray-100 hover:bg-gray-200 p-4 rounded-md shadow-sm transition-all duration-200 relative">
      <div className="absolute top-2 right-4 flex items-center text-xs text-gray-500 gap-1">
        <EyeOff size={16} strokeWidth={1.5} />
        <span>{data.timeAgo}</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-800 text-base">{data.title}</p>
          {data.isNew && (
            <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full font-medium">
              New
            </span>
          )}
          {data.priority === 'urgent' && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
              Urgent Priority
            </span>
          )}
          {data.is_public && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
              Public
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 pr-16">{data.content}</p>

        {data.expires_at && (
          <p className="text-xs text-gray-500 mt-1">
            Expires: {new Date(data.expires_at).toLocaleDateString()}
          </p>
        )}

        {data.isNew && (
          <div
            onClick={onMark}
            className="flex items-center text-xs text-black gap-1 mt-1 cursor-pointer w-max hover:underline"
          >
            <CheckCircle size={14} />
            Mark as read
          </div>
        )}

        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onEdit} title="Edit">
            <Pencil size={16} className="text-black hover:text-blue-600" />
          </button>
          <button onClick={onDelete} title="Delete">
            <Trash2 size={16} className="text-black hover:text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorNoticePage;