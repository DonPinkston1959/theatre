import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { TheatreEvent } from '../types';
import EventPopup from './EventPopup';
import { parseLocalDate } from '../utils/date';

interface EventListProps {
  events: TheatreEvent[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState<TheatreEvent | null>(null);

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Calendar className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
        <p className="text-gray-600">Try adjusting your filters to see more events.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="p-6 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 pt-1">
                      <div className="w-12 h-12 bg-red-800 rounded-lg flex flex-col items-center justify-center text-white">
                        <span className="text-xs font-medium uppercase">
                          {parseLocalDate(event.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {parseLocalDate(event.date).getDate()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                        {event.title}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 font-medium">
                          {event.theatreName}
                        </p>
                        {event.venue && event.venue !== event.theatreName && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTime(event.time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {event.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {event.eventType}
                    </span>
                    {event.signLanguageInterpreting && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ASL Available
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <EventPopup
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
};

export default EventList;
