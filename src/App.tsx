import React, { useState, useEffect, useMemo } from 'react';
import { Theater as Theatre, Settings, Mail } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Database } from './lib/supabase';
import Calendar from './components/Calendar';
import EventList from './components/EventList';
import { filterEvents } from './utils/filterEvents';
import FilterPanel from './components/FilterPanel';
import AdminPanel from './components/AdminPanel';
import ContactForm from './components/ContactForm';
import { TheatreEvent, FilterOptions, CalendarView } from './types';

function App() {
  const [events, setEvents] = useState<TheatreEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TheatreEvent[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    theatreCompanies: [],
    theatres: [],
    eventTypes: [],
    timeOfDay: 'all',
    signLanguageInterpreting: undefined
  });
  const [displayMode, setDisplayMode] = useState<'calendar' | 'list'>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView['type']>('month');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [lastNonDayView, setLastNonDayView] = useState<CalendarView['type']>('month');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);

      const pageSize = 1000;
      let from = 0;
      const allEvents: Database['public']['Tables']['events']['Row'][] = [];

      while (true) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          allEvents.push(...data);
        }

        if (!data || data.length < pageSize) {
          break;
        }

        from += pageSize;
      }

      const transformedEvents = allEvents.map(event => ({
        id: event.id,
        title: event.title,
        theatreName: event.theatre_name,
        eventType: event.event_type,
        date: event.date,
        time: event.time,
        description: event.description || '',
        websiteUrl: event.website_url || '',
        ticketUrl: event.ticket_url || undefined,
        venue: event.venue || undefined,
        price: event.price || undefined,
        signLanguageInterpreting: event.sign_language_interpreting || false
      }));

      setEvents(transformedEvents);
      setError(null);
    } catch (err) {
      setError('Failed to load events from Supabase database. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    const filtered = filterEvents(events, filters);
    setFilteredEvents(filtered);
  }, [events, filters]);

  const sortedFilteredEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  }, [filteredEvents]);

  const handleCalendarViewChange = (nextView: CalendarView['type']) => {
    if (nextView !== 'day') {
      setLastNonDayView(nextView);
    }
    setCalendarView(nextView);
  };

  useEffect(() => {
    const toDate = (value?: string) => {
      if (!value) {
        return null;
      }
      const [year, month, day] = value.split('-').map(Number);
      if (!year || !month || !day) {
        return null;
      }
      return new Date(year, month - 1, day);
    };

    const { startDate, endDate } = filters;

    if (!startDate && !endDate) {
      const today = new Date();
      setCalendarDate(today);
      if (calendarView === 'day' && lastNonDayView !== 'day') {
        setCalendarView(lastNonDayView);
      }
      return;
    }

    if (startDate && (!endDate || endDate === startDate)) {
      const target = toDate(startDate);
      if (target) {
        setCalendarDate(target);
        if (calendarView !== 'day') {
          setLastNonDayView(calendarView);
          setCalendarView('day');
        }
      }
      return;
    }

    const reference = toDate(startDate ?? endDate);
    if (reference) {
      setCalendarDate(reference);
      if (calendarView === 'day' && lastNonDayView !== 'day') {
        setCalendarView(lastNonDayView);
      }
    }
  }, [filters.startDate, filters.endDate, calendarView, lastNonDayView]);

  const handleEventClick = (event: TheatreEvent) => {
    // Event click handling is managed by the EventPopup component
    console.log('Event clicked:', event.title);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KC Live Theatre events from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <Theatre className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Events</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-red-800 p-2 rounded-lg">
                <Theatre className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">KC Live Theatre</h1>
                <p className="text-sm text-gray-600">Kansas City Theatre Events</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsContactFormOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Contact Website Manager"
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Admin Panel"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filter Panel */}
          <div className="w-full mb-6">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              events={events}
            />
          </div>

          {/* Calendar */}
          <div className="w-full">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  KC Live Theatre and Fine Arts Event Calendar
                </h2>
                <p className="text-gray-600">
                  Showing {sortedFilteredEvents.length} of {events.length} events
                  {filters.theatreCompanies.length > 0 || filters.theatres.length > 0 || filters.eventTypes.length > 0 || filters.startDate || filters.endDate || filters.timeOfDay !== 'all' || filters.signLanguageInterpreting
                    ? ' (filtered)' 
                    : ''
                  }
                </p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 self-start">
                <button
                  type="button"
                  onClick={() => setDisplayMode('calendar')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    displayMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-pressed={displayMode === 'calendar'}
                >
                  Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('list')}
                  className={`ml-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    displayMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-pressed={displayMode === 'list'}
                >
                  List
                </button>
              </div>
            </div>

            {displayMode === 'calendar' ? (
              <Calendar
                events={sortedFilteredEvents}
                onEventClick={handleEventClick}
                currentDate={calendarDate}
                onDateChange={setCalendarDate}
                view={calendarView}
                onViewChange={handleCalendarViewChange}
              />
            ) : (
              <EventList events={sortedFilteredEvents} />
            )}
          </div>
        </div>
      </main>

      {/* Admin Panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onDataUpdate={fetchData}
      />

      {/* Contact Form */}
      <ContactForm
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              © 2025 KC Live Theatre. Discover the best of Kansas City's theatre scene.
            </p>
            <p className="text-sm">
              For theatre submissions or inquiries, contact your local venues directly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;



















