import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import { CalendarDays, Loader2, X, ExternalLink } from "lucide-react";
import { getAuth } from "../../../lib/api";

type EventType = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  link: string;
};

// Modal Component for Event Details (Read-only)
const EventModal: React.FC<{
  event: EventType | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ event, isOpen, onClose }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Event Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
          </div>

          <div>
            <span className="font-medium">Date: </span>
            <span>{dayjs(event.date).format("MMMM D, YYYY")}</span>
          </div>

          {event.time && (
            <div>
              <span className="font-medium">Time: </span>
              <span>
                {dayjs(`${event.date}T${event.time}`).format("hh:mm A")}
              </span>
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
      </div>
    </div>
  );
};

const MemberCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch events from API
  useEffect(() => {
    let alive = true;

    const fetchEvents = async () => {
      setLoading(true);
      setErr("");

      try {
        const auth = getAuth();
        const res = await fetch(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/member/events/event.php?action=list`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
            },
            credentials: "include",
          }
        );

        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Non-JSON from events API:\n", text);
          throw new Error("API did not return JSON");
        }

        if (!alive) return;

        if (data?.events) {
          const fetchedEvents: EventType[] = data.events.map((item: any) => ({
            id: String(item.id),
            title: item.title || "",
            date: item.date || "",
            time: item.time ? item.time.slice(0, 5) : "",
            description: item.description || "",
            link: item.meet_link || "",
          }));
          setEvents(fetchedEvents);
        } else {
          setErr(data?.message || "Failed to load events");
        }
      } catch (e: any) {
        console.error("Fetch events error:", e);
        if (alive) setErr("Server error while loading events.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchEvents();
    return () => {
      alive = false;
    };
  }, []);

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr);
  };

  const handleEventClick = (arg: any) => {
    const eventId = arg.event.id;
    const event = events.find((e) => e.id === eventId);

    if (event) {
      setSelectedEvent(event);
      setShowModal(true);
    }
  };

  const eventsOnDate = events.filter((e) => e.date === selectedDate);

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex flex-col">
        <div className="font-bold text-3xl flex gap-2 items-center">
          <CalendarDays size={30} />
          Calendar
        </div>
        <div className="text-xs text-gray-600">
          View meetings and scheduled events
        </div>
      </div>

      {/* Error Display */}
      {err && (
        <div className="text-sm text-red-600 border border-red-300 rounded p-2">
          {err}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-4 bg-white border rounded-md">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>Loading events...</span>
        </div>
      )}

      {/* Calendar and Sidebar */}
      {!loading && (
        <div className="flex border rounded-md overflow-hidden">
          <div className="w-full p-4 bg-white">
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
                left: "today prev,next",
                center: "title",
                right: "dayGridMonth,dayGridWeek,dayGridDay,listWeek",
              }}
              buttonText={{
                today: "Today",
                next: "Next",
                prev: "Back",
                month: "Month",
                week: "Week",
                day: "Day",
                list: "Agenda",
              }}
              dayHeaderContent={(arg) => (
                <span className="font-bold text-gray-800">{arg.text}</span>
              )}
            />
          </div>

          {eventsOnDate.length > 0 ? (
            eventsOnDate.map((event) => (
              <div
                key={event.id}
                className="p-2 mb-2 border rounded-md shadow-sm bg-white text-sm cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedEvent(event);
                  setShowModal(true);
                }}
              >
                <h3 className="font-semibold">{event.title}</h3>
                {event.time && (
                  <p className="text-xs text-gray-700">
                    🕒 {dayjs(`${event.date}T${event.time}`).format("hh:mm A")}
                  </p>
                )}
                {event.description && (
                  <p className="text-xs text-gray-600">{event.description}</p>
                )}
                {event.link && (
                  <div className="mt-1">
                    <span className="text-cyan-600 text-xs">
                      📞 Meeting Available
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <></>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default MemberCalendarPage;
