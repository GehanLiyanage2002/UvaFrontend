import React, { useState, useEffect } from 'react';
import { Bell, EyeOff, CheckCircle } from 'lucide-react';
import Button from '../../ui/PublicUI/Button';
import { getAuth } from '../../../lib/api'; // Assuming you have this for auth

type Notice = {
  id: number;
  title: string;
  content: string;
  timeAgo: string;
  isNew: boolean;
  priority?: string; // Optional fields from API
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

const ManagerNoticePage = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let alive = true;

    const fetchNotices = async () => {
      setLoading(true);
      setErr('');

      try {
        const auth = getAuth();
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/manager/notices/notice.php?action=list&status=active`,
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

        if (!alive) return;

        if (data?.success && data?.data) {
          const fetchedNotices: Notice[] = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            timeAgo: timeAgo(item.updated_at || item.created_at),
            isNew: new Date(item.updated_at || item.created_at).getTime() > new Date().getTime() - 7 * 24 * 60 * 60 * 1000, // New if within last 7 days
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
          setErr(data?.message || 'Failed to load notices');
        }
      } catch (e: any) {
        console.error('Fetch notices error:', e);
        if (alive) setErr('Server error while loading notices.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchNotices();
    return () => { alive = false; };
  }, []);

  const markAsRead = (id: number) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isNew: false } : n))
    );
  };

  return (
    <div className='flex flex-col gap-6 pb-4'>
      <div className='flex justify-between'>
        <div>
          <div className='font-bold text-3xl flex gap-2 items-center'>
            <Bell size={30} />
            Notices
          </div>
          <div className='text text-xs'>Stay updated with the latest announcements and reminders</div>
        </div>
        <div className='flex gap-3'>
          {/* Add buttons here if needed, e.g., for creating a new notice */}
        </div>
      </div>

      {/* Error Display */}
      {err && (
        <div className='text-sm text-red-600 border border-red-300 rounded p-2'>{err}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className='flex flex-col gap-3'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='bg-gray-100 p-4 rounded-md shadow-sm opacity-50'>
              <div className='flex items-center gap-2'>
                <p className='font-bold text-gray-800 text-base'>Loading...</p>
              </div>
              <p className='text-xs text-gray-700 mt-1'>Loading content...</p>
            </div>
          ))}
        </div>
      )}

      {/* Notices List */}
      {!loading && notices.length === 0 && (
        <div className='text-gray-500 text-center py-4'>No notices available.</div>
      )}

      {!loading && notices.length > 0 && (
        <div className='flex flex-col gap-3'>
          {notices.map((note) => (
            <NoticeCard key={note.id} data={note} onMark={() => markAsRead(note.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

const NoticeCard = ({ data, onMark }: { data: Notice; onMark: () => void }) => {
  return (
    <div className='bg-gray-100 hover:bg-gray-200 p-4 rounded-md shadow-sm transition-all duration-200 relative'>
      <div className='absolute top-2 right-4 flex items-center text-xs text-gray-500 gap-1'>
        <EyeOff size={16} strokeWidth={1.5} />
        <span>{data.timeAgo}</span>
      </div>
      <div className='flex items-center gap-2'>
        <p className='font-bold text-gray-800 text-base'>{data.title}</p>
        {data.isNew && (
          <span className='bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium'>
            New
          </span>
        )}
      </div>
      <p className='text-xs text-gray-700 mt-1'>{data.content}</p>
    </div>
  );
};

export default ManagerNoticePage;