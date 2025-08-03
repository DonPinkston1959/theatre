import React from 'react';
import { X, Clock, MapPin, ExternalLink, Tag, DollarSign, Accessibility } from 'lucide-react';
import { TheatreEvent } from '../types';

interface EventPopupProps {
  event: TheatreEvent;
  onClose: () => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ event, onClose }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Musical':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Play':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Comedy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Drama':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Children':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Opera':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Dance':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(event.eventType)}`}>
                <Tag className="w-3 h-3 inline mr-1" />
                {event.eventType}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date and Time */}
          <div className="flex items-center space-x-3 text-gray-700">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium">{formatDate(event.date)}</p>
              <p className="text-sm">{formatTime(event.time)}</p>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-start space-x-3 text-gray-700">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">{event.theatreName}</p>
              {event.venue && event.venue !== event.theatreName && (
                <p className="text-sm text-gray-600">{event.venue}</p>
              )}
            </div>
          </div>

          {/* Price */}
          {event.price && (
            <div className="flex items-center space-x-3 text-gray-700">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <p className="font-medium">{event.price}</p>
            </div>
          )}

          {/* Sign Language Interpreting */}
          {event.signLanguageInterpreting && (
            <div className="flex items-center space-x-3 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
              <Accessibility className="w-5 h-5 text-green-600" />
              <p className="font-medium">Sign Language Interpreting Available</p>
            </div>
          )}
          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About this event</h3>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {event.websiteUrl && (
              <a
                href={event.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors duration-200 flex items-center justify-center text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Theatre Website
              </a>
            )}
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Buy Tickets
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;