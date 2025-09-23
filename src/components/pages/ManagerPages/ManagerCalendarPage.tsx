import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import dayjs from 'dayjs';
import { CalendarDays, Loader2, X, Edit, Trash2, ExternalLink } from 'lucide-react';
import { getAuth } from '../../../lib/api';

type EventType = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  link: string;
};

// Modal Component for Event Details
const EventModal: React.FC<{
  event: EventType | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: EventType) => void;
  onDelete: (id: string) => void;
}> = ({ event, isOpen, onClose, onEdit, onDelete }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Event Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
          </div>
          
          <div>
            <span className="font-medium">Date: </span>
            <span>{dayjs(event.date).format('MMMM D, YYYY')}</span>
          </div>
          
          {event.time && (
            <div>
              <span className="font-medium">Time: </span>
              <span>{dayjs(`${event.date}T${event.time}`).format('hh:mm A')}</span>
            </div>
          )}
          
          {event.description && (
            <div>
              <span className="font-medium">Description: </span>
              <p className="text-gray-700 mt-1">{event.description}</p>
            </div>
          )}
          
          {event.link && (
            <div>
              <span className="font-medium">Meeting Link: </span>
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:underline flex items-center gap-1"
              >
                Join Meeting <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <button
            onClick={() => {
              onEdit(event);
              onClose();
            }}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(event.id);
              onClose();
            }}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ManagerCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newEvent, setNewEvent] = useState<EventType>({
    id: '',
    title: '',
    date: '',
    time: '',
    description: '',
    link: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch events from API
  useEffect(() => {
    let alive = true;

    const fetchEvents = async () => {
      setLoading(true);
      setErr('');

      try {
        const auth = getAuth();
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/manager/events/event.php?action=list`,
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
          console.error('Non-JSON from events API:\n', text);
          throw new Error('API did not return JSON');
        }

        if (!alive) return;

        if (data?.events) {
          const fetchedEvents: EventType[] = data.events.map((item: any) => ({
            id: String(item.id),
            title: item.title || '',
            date: item.date || '',
            time: item.time ? item.time.slice(0, 5) : '',
            description: item.description || '',
            link: item.meet_link || '',
          }));
          setEvents(fetchedEvents);
        } else {
          setErr(data?.message || 'Failed to load events');
        }
      } catch (e: any) {
        console.error('Fetch events error:', e);
        if (alive) setErr('Server error while loading events.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchEvents();
    return () => { alive = false; };
  }, []);

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr);
    setNewEvent({ ...newEvent, date: arg.dateStr });
  };

  const handleEventClick = async (arg: any) => {
    const eventId = arg.event.id;
    
    try {
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/events/event.php?action=get&id=${eventId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const text = await res.text();
      let data: any;
      
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON from get event API:\n', text);
        throw new Error('API did not return JSON');
      }
      
      if (data?.success && data?.event) {
        const event: EventType = {
          id: String(data.event.id),
          title: data.event.title || '',
          date: data.event.date || '',
          time: data.event.time ? data.event.time.slice(0, 5) : '',
          description: data.event.description || '',
          link: data.event.meet_link || '',
        };
        setSelectedEvent(event);
        setShowModal(true);
      } else {
        setErr(data?.message || 'Failed to load event details');
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setErr(error instanceof Error ? error.message : 'Error loading event details');
    }
  };

  const eventsOnDate = events.filter((e) => e.date === selectedDate);

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) {
      setErr('Title and date are required.');
      return;
    }

    setSubmitting(true);
    setErr('');

    try {
      const auth = getAuth();
      const eventData = {
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time || undefined,
        meet_link: newEvent.link || undefined,
        description: newEvent.description || undefined,
      };

      let res;
      
      if (newEvent.id) {
        // Update existing event
        res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/manager/events/event.php?action=update&id=${newEvent.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
            },
            credentials: 'include',
            body: JSON.stringify(eventData),
          }
        );
      } else {
        // Create new event
        res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/manager/events/event.php?action=create`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
            },
            credentials: 'include',
            body: JSON.stringify(eventData),
          }
        );
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const text = await res.text();
      let data: any;
      
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON from create/update API:\n', text);
        throw new Error('API did not return JSON');
      }

      if (data?.success) {
        // Refresh events list
        const fetchRes = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/manager/events/event.php?action=list`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
            },
            credentials: 'include',
          }
        );

        if (fetchRes.ok) {
          const fetchText = await fetchRes.text();
          try {
            const fetchData = JSON.parse(fetchText);
            if (fetchData?.events) {
              const refreshedEvents: EventType[] = fetchData.events.map((item: any) => ({
                id: String(item.id),
                title: item.title || '',
                date: item.date || '',
                time: item.time ? item.time.slice(0, 5) : '',
                description: item.description || '',
                link: item.meet_link || '',
              }));
              setEvents(refreshedEvents);
            }
          } catch {
            console.error('Failed to parse refresh response');
          }
        }

        setNewEvent({ id: '', title: '', date: '', time: '', description: '', link: '' });
      } else {
        setErr(data?.message || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setErr(error instanceof Error ? error.message : 'Error saving event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    setSubmitting(true);
    setErr('');

    try {
      const auth = getAuth();
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/manager/events/event.php?action=delete&id=${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          credentials: 'include',
        }
      );

      // Check if the response is ok
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const text = await res.text();
      let data: any;
      
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON from delete API:\n', text);
        throw new Error('API did not return JSON');
      }
      console.log(data);
      if (data?.success) {
        setEvents(events.filter((e) => e.id !== id));
        // Clear form if editing this event
        if (newEvent.id === id) {
          setNewEvent({ id: '', title: '', date: '', time: '', description: '', link: '' });
        }
      } else {
        setErr(data?.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setErr(error instanceof Error ? error.message : 'Error deleting event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event: EventType) => {
    setNewEvent({
      id: event.id,
      title: event.title || '',
      date: event.date || '',
      time: event.time || '',
      description: event.description || '',
      link: event.link || '',
    });
  };

  const clearForm = () => {
    setNewEvent({ id: '', title: '', date: '', time: '', description: '', link: '' });
    setErr('');
  };

  return (
    <div className='flex flex-col gap-6 pb-4'>
      <div className='flex flex-col'>
        <div className='font-bold text-3xl flex gap-2 items-center'>
          <CalendarDays size={30} />
          Calendar
        </div>
        <div className='text-xs text-gray-600'>View meetings and schedule new events</div>
      </div>

      {/* Error Display */}
      {err && (
        <div className='text-sm text-red-600 border border-red-300 rounded p-2'>{err}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className='flex items-center justify-center p-4 bg-white border rounded-md'>
          <Loader2 className='animate-spin mr-2' size={24} />
          <span>Loading events...</span>
        </div>
      )}

      {/* Calendar and Sidebar */}
      {!loading && (
        <div className='flex border rounded-md overflow-hidden'>
          <div className='w-2/3 p-4 bg-white'>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              events={events.map((e) => ({
                id: e.id,
                title: e.title,
                date: e.date,
              }))}
              eventContent={(arg) => (
                <div className="flex items-center text-xs cursor-pointer">
                  <span>{arg.event.title}</span>
                </div>
              )}
              dayMaxEvents={3}
              headerToolbar={{
                left: 'today prev,next',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay,listWeek'
              }}
              buttonText={{
                today: 'Today',
                next: 'Next',
                prev: 'Back',
                month: 'Month',
                week: 'Week',
                day: 'Day',
                list: 'Agenda',
              }}
              dayHeaderContent={(arg) => (
                <span className="font-bold text-gray-800">{arg.text}</span>
              )}
            />
          </div>

          <div className='w-1/3 p-4 border-l bg-gray-50'>
            <h2 className='text-xl font-bold mb-2'>Events - {selectedDate || ''}</h2>

            {eventsOnDate.length > 0 ? (
              eventsOnDate.map((event) => (
                <div key={event.id} className='p-2 mb-2 border rounded-md shadow-sm bg-white text-sm'>
                  <h3 className='font-semibold'>{event.title}</h3>
                  {event.time && (
                    <p className='text-xs text-gray-700'>
                      🕒 {dayjs(`${event.date}T${event.time}`).format('hh:mm A')}
                    </p>
                  )}
                  {event.description && <p className='text-xs'>{event.description}</p>}
                  {event.link && (
                    <a
                      href={event.link}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-cyan-600 text-xs hover:underline'
                    >
                      Join Meeting
                    </a>
                  )}
                  <div className='mt-2 flex gap-2 items-center'>
                    <button 
                      onClick={() => handleEdit(event)} 
                      className='text-[10px] text-yellow-600 hover:underline'
                      disabled={submitting}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)} 
                      className='text-[10px] text-red-500 hover:underline'
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-sm text-gray-500'>No events for this date.</p>
            )}

            <div className='border-t mt-4 pt-4'>
              <div className="flex justify-between items-center mb-2">
                <h3 className='font-semibold'>
                  {newEvent.id ? 'Edit Event' : 'Schedule New Event'}
                </h3>
                {newEvent.id && (
                  <button 
                    onClick={clearForm}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <input
                type='text'
                placeholder='Title'
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className='w-full mb-2 border px-2 py-1 rounded'
                disabled={submitting}
              />
              <input
                type='date'
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className='w-full mb-2 border px-2 py-1 rounded'
                disabled={submitting}
              />
              <input
                type='time'
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className='w-full mb-2 border px-2 py-1 rounded'
                disabled={submitting}
              />
              <input
                type='text'
                placeholder='Meeting Link'
                value={newEvent.link}
                onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                className='w-full mb-2 border px-2 py-1 rounded'
                disabled={submitting}
              />
              <textarea
                placeholder='Description'
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className='w-full mb-2 border px-2 py-1 rounded'
                disabled={submitting}
              />
              <button
                onClick={handleAddEvent}
                disabled={submitting}
                className='bg-cyan-500 text-white px-4 py-1 rounded text-sm hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                {submitting && <Loader2 className="animate-spin" size={14} />}
                {newEvent.id ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ManagerCalendarPage;