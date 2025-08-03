import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid, List, Eye } from 'lucide-react';
import { TheatreEvent, CalendarView } from '../types';
import EventPopup from './EventPopup';

interface CalendarProps {
  events: TheatreEvent[];
  onEventClick: (event: TheatreEvent) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView['type']>('month');
  const [selectedEvent, setSelectedEvent] = useState<TheatreEvent | null>(null);

  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date, month: Date) => {
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const days = direction === 'prev' ? -7 : 7;
      newDate.setDate(prev.getDate() + days);
      return newDate;
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const days = direction === 'prev' ? -1 : 1;
      newDate.setDate(prev.getDate() + days);
      return newDate;
    });
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
    }
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long' 
    };
    
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    if (view === 'week') {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
      }
    }
    
    return currentDate.toLocaleDateString('en-US', options);
  };

  const handleEventClick = (event: TheatreEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    onEventClick(event);
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderMonthView = () => {
    const days = getMonthDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="p-3 text-center font-semibold text-gray-600 border-b">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          
          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-colors duration-200 ${
                isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'
              } ${isTodayDate ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`text-xs p-1 rounded cursor-pointer transition-colors duration-200 ${
                      event.eventType === 'Musical' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                      event.eventType === 'Play' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                      event.eventType === 'Comedy' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                      event.eventType === 'Drama' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                      'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-75">{formatTime(event.time)}</div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isTodayDate = isToday(day);
          
          return (
            <div key={index} className="border border-gray-200">
              <div className={`p-3 text-center font-semibold border-b ${isTodayDate ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'}`}>
                <div className="text-sm">{dayNames[index]}</div>
                <div className="text-lg">{day.getDate()}</div>
              </div>
              <div className="p-2 min-h-[300px]">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`mb-2 p-2 rounded cursor-pointer transition-colors duration-200 ${
                      event.eventType === 'Musical' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                      event.eventType === 'Play' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                      event.eventType === 'Comedy' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                      event.eventType === 'Drama' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                      'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs opacity-75">{formatTime(event.time)}</div>
                    <div className="text-xs opacity-75">{event.theatreName}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isTodayDate = isToday(currentDate);

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className={`p-4 border-b ${isTodayDate ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold ${isTodayDate ? 'text-blue-600' : ''}`}>
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        <div className="p-4">
          {dayEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events scheduled for this day</p>
          ) : (
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={(e) => handleEventClick(event, e)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 ${
                    event.eventType === 'Musical' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                    event.eventType === 'Play' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                    event.eventType === 'Comedy' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                    event.eventType === 'Drama' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{event.title}</h4>
                      <p className="text-sm opacity-75">{event.theatreName}</p>
                      <p className="text-sm opacity-75">{event.eventType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatTime(event.time)}</p>
                      {event.price && <p className="text-sm opacity-75">{event.price}</p>}
                    </div>
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
          <button
            onClick={() => handleNavigation('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
            {formatDateHeader()}
          </h2>
          <button
            onClick={() => handleNavigation('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
              view === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid className="w-4 h-4 inline mr-1" />
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
              view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4 inline mr-1" />
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
              view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Day
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-4">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Event Popup */}
      {selectedEvent && (
        <EventPopup
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default Calendar;