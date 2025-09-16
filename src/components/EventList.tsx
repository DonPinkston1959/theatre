import React, { useMemo } from 'react';
import { TheatreEvent } from '../types';

interface EventListProps {
  events: TheatreEvent[];
}

const truncate = (value: string, maxLength: number) => {
  if (!value) {
    return '';
  }
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength).trimEnd()}…`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) {
    return '';
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    return dateStr;
  }
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) {
    return '';
  }
  const [hours = '00', minutes = '00'] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) {
    return timeStr;
  }
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};

const EventList: React.FC<EventListProps> = ({ events }) => {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  }, [events]);

  if (sortedEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Performance List</h3>
        </div>
        <div className="px-4 py-12 text-center text-gray-500">
          No events found for the selected filters.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Performance List</h3>
        <span className="text-sm text-gray-500">{sortedEvents.length} events</span>
      </div>
      <div
        className="max-h-[600px] overflow-y-auto focus:outline-none"
        tabIndex={0}
        aria-label="Performance list"
      >
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 sticky top-0">
          <div className="col-span-3">Show</div>
          <div className="col-span-3">Company</div>
          <div className="col-span-3">Theatre</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1">Start</div>
        </div>
        {sortedEvents.map(event => {
          const companyText = truncate(event.theatreName, 25);
          const venueText = truncate(event.venue || event.theatreName, 25);
          return (
            <div
              key={event.id}
              className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 text-sm text-gray-800 items-center hover:bg-gray-50 focus-within:bg-gray-50"
            >
              <div className="col-span-3 font-medium whitespace-nowrap" title={event.title}>
                {truncate(event.title, 25)}
              </div>
              <div className="col-span-3 whitespace-nowrap" title={event.theatreName}>
                {event.websiteUrl ? (
                  <a
                    href={event.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {companyText}
                  </a>
                ) : (
                  <span>{companyText}</span>
                )}
              </div>
              <div className="col-span-3 whitespace-nowrap" title={event.venue || event.theatreName}>
                {venueText}
              </div>
              <div className="col-span-2 whitespace-nowrap">
                {formatDate(event.date)}
              </div>
              <div className="col-span-1 whitespace-nowrap font-medium">
                {formatTime(event.time)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventList;
