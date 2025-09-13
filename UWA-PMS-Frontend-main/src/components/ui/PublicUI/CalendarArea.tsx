import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type EventType = {
    id: string;
    date: string;
};

const CalendarArea: React.FC = () => {
    const calendarRef = useRef<FullCalendar | null>(null);
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());

    const events: EventType[] = [
        { id: '1', date: '2025-06-02' },
        { id: '2', date: '2025-06-03' },
        { id: '3', date: '2025-06-10' },
        { id: '4', date: '2025-06-15' },
        { id: '5', date: '2025-06-20' },
    ];

    const meetingDates = events.map(e => e.date);

    const updateTitle = () => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            setCurrentDate(calendarApi.getDate());
        }
    };

    const handlePrev = () => {
        calendarRef.current?.getApi().prev();
        updateTitle();
    };

    const handleNext = () => {
        calendarRef.current?.getApi().next();
        updateTitle();
    };

    const handleToday = () => {
        calendarRef.current?.getApi().today();
        updateTitle();
    };

    return (
        <div className="border rounded-md text-xs p-2">
            <style>{`
        .fc-daygrid-event {
          display: none !important;
        }
        .fc-scrollgrid {
          overflow: hidden !important;
        }
        .fc .fc-daygrid-day-frame {
          padding: 0 !important;
          height: 30px !important;
        }
        .fc .fc-daygrid-day {
          height: 32px !important;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border: none !important;
        }
        .fc .fc-toolbar-title {
          font-size: 0.75rem;
          font-weight: 600;
        }
      `}</style>
            <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center gap-3">
                    <button onClick={handlePrev} className="hover:text-cyan-600">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={handleToday} className="text-[11px] px-2 py-0.5 border rounded hover:bg-cyan-100">
                        Today
                    </button>
                    <button onClick={handleNext} className="hover:text-cyan-600">
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div className="font-semibold text-[13px] text-gray-700">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
            </div>

            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                height="auto"
                contentHeight="auto"
                expandRows={true}
                showNonCurrentDates={true}
                events={events}
                dateClick={() => navigate('calendar')}
                eventContent={() => null}
                datesSet={updateTitle}
                dayCellContent={(arg) => {
                    const dateStr = arg.date.toISOString().split('T')[0];
                    const isMeetingDay = meetingDates.includes(dateStr);
                    return (
                        <div className="flex justify-center items-center h-5 w-5 mx-auto">
                            <span
                                className={`text-[10px] font-medium flex justify-center items-center h-5 w-5 ${isMeetingDay ? 'bg-cyan-600 text-white rounded-full' : ''
                                    }`}
                            >
                                {arg.dayNumberText}
                            </span>
                        </div>
                    );
                }}
                dayHeaderContent={(arg) => (
                    <span className="text-[10px] font-semibold text-gray-700">{arg.text}</span>
                )}
            />
        </div>
    );
};

export default CalendarArea;
