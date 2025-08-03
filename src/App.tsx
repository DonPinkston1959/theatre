import React, { useState, useEffect } from 'react';
import { Theater as Theatre, Palette, Settings, Plus } from 'lucide-react';
import Calendar from './components/Calendar';
import FilterPanel from './components/FilterPanel';
import AdminPanel from './components/AdminPanel';
import { TheatreEvent, Theatre as TheatreType, FilterOptions } from './types';

function App() {
  const [events, setEvents] = useState<TheatreEvent[]>([]);
  const [theatres, setTheatres] = useState<TheatreType[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TheatreEvent[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    theatres: [],
    eventTypes: [],
    timeOfDay: 'all',
    signLanguageInterpreting: undefined
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsResponse, theatresResponse] = await Promise.all([
        fetch('http://localhost:3001/api/events'),
        fetch('http://localhost:3001/api/theatres')
      ]);

      if (!eventsResponse.ok || !theatresResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const eventsData = await eventsResponse.json();
      const theatresData = await theatresResponse.json();

      setEvents(eventsData);
      setTheatres(theatresData);
      setError(null);
    } catch (err) {
      setError('Failed to load events. Please try again later.');
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
    let filtered = [...events];

    // Filter by theatres
    if (filters.theatres.length > 0) {
      filtered = filtered.filter(event => 
        filters.theatres.includes(event.theatreName)
      );
    }

    // Filter by event types
    if (filters.eventTypes.length > 0) {
      filtered = filtered.filter(event => 
        filters.eventTypes.includes(event.eventType)
      );
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(event => event.date >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(event => event.date <= filters.endDate!);
    }

    // Filter by time of day
    if (filters.timeOfDay && filters.timeOfDay !== 'all') {
      filtered = filtered.filter(event => {
        const [hours] = event.time.split(':').map(Number);
        
        switch (filters.timeOfDay) {
          case 'morning':
            return hours < 12;
          case 'afternoon':
            return hours >= 12 && hours < 17;
          case 'evening':
            return hours >= 17;
          default:
            return true;
        }
      });
    }

    // Filter by sign language interpreting
    if (filters.signLanguageInterpreting) {
      filtered = filtered.filter(event => event.signLanguageInterpreting === true);
    }
    setFilteredEvents(filtered);
  }, [events, filters]);

  const handleEventClick = (event: TheatreEvent) => {
    // Event click handling is managed by the EventPopup component
    console.log('Event clicked:', event.title);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KC Live Theatre events...</p>
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
        <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Filter Panel */}
          <aside className="lg:w-72 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              theatres={theatres}
              isOpen={isFilterPanelOpen}
              onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            />
          </aside>

          {/* Calendar */}
          <div className="flex-1">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Theatre Events Calendar
              </h2>
              <p className="text-gray-600">
                Showing {filteredEvents.length} of {events.length} events
                {filters.theatres.length > 0 || filters.eventTypes.length > 0 || filters.startDate || filters.endDate || filters.timeOfDay !== 'all' || filters.signLanguageInterpreting
                  ? ' (filtered)' 
                  : ''
                }
              </p>
            </div>

            <Calendar
              events={filteredEvents}
              onEventClick={handleEventClick}
            />
          </div>
        </div>
      </main>

      {/* Admin Panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onDataUpdate={fetchData}
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