import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filter, Calendar, Tag, Building, Users, Accessibility, ChevronDown, X } from 'lucide-react';
import { FilterOptions, TheatreEvent } from '../types';\r\nimport { filterEventsExcluding } from '../utils/filterEvents';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  theatres: Theatre[];
  events: TheatreEvent[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  theatres,
  events
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const eventsForEventTypeOptions = useMemo(
    () => filterEventsExcluding(events, filters, 'eventTypes'),
    [events, filters]
  );
  const eventsForCompanyOptions = useMemo(
    () => filterEventsExcluding(events, filters, 'theatreCompanies'),
    [events, filters]
  );
  const eventsForVenueOptions = useMemo(
    () => filterEventsExcluding(events, filters, 'theatres'),
    [events, filters]
  );

  const uniqueEventTypes = useMemo(() => {
    const values = new Set(eventsForEventTypeOptions.map(event => event.eventType));
    filters.eventTypes.forEach(type => values.add(type));
    return Array.from(values).sort();
  }, [eventsForEventTypeOptions, filters.eventTypes]);

  const uniqueTheatreCompanies = useMemo(() => {
    const values = new Set(eventsForCompanyOptions.map(event => event.theatreName));
    filters.theatreCompanies.forEach(company => values.add(company));
    return Array.from(values).sort();
  }, [eventsForCompanyOptions, filters.theatreCompanies]);

  const uniqueTheatreVenues = useMemo(() => {
    const values = new Set(
      eventsForVenueOptions
        .map(event => event.venue || event.theatreName)
        .filter((name): name is string => Boolean(name))
    );
    filters.theatres.forEach(venue => values.add(venue));
    return Array.from(values).sort();
  }, [eventsForVenueOptions, filters.theatres]);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    const newEventTypes = checked
      ? [...filters.eventTypes, eventType]
      : filters.eventTypes.filter(t => t !== eventType);
    
    onFiltersChange({ ...filters, eventTypes: newEventTypes });
  };

  const handleTheatreCompanyChange = (company: string, checked: boolean) => {
    const newCompanies = checked
      ? [...filters.theatreCompanies, company]
      : filters.theatreCompanies.filter(t => t !== company);
    
    onFiltersChange({ ...filters, theatreCompanies: newCompanies });
  };

  const handleTheatreVenueChange = (venue: string, checked: boolean) => {
    const newVenues = checked
      ? [...filters.theatres, venue]
      : filters.theatres.filter(t => t !== venue);
    
    onFiltersChange({ ...filters, theatres: newVenues });
  };

  const clearFilters = () => {
    onFiltersChange({
      theatreCompanies: [],
      theatres: [],
      eventTypes: [],
      startDate: undefined,
      endDate: undefined,
      timeOfDay: 'all',
      signLanguageInterpreting: undefined
    });
  };

  const activeFilterCount = 
    filters.theatreCompanies.length + 
    filters.theatres.length + 
    filters.eventTypes.length + 
    (filters.startDate ? 1 : 0) + 
    (filters.endDate ? 1 : 0) + 
    (filters.signLanguageInterpreting ? 1 : 0);

  const FilterDropdown: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    activeCount?: number;
  }> = ({ id, title, icon, children, activeCount }) => {
    const isOpen = openDropdown === id;
    
    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : id)}
          className={`flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
            activeCount ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
        >
          {icon}
          <span className="text-sm font-medium">{title}</span>
          {typeof activeCount === 'number' && activeCount > 0 && (
            <span className="ml-2 bg-red-800 text-white text-xs px-2 py-1 rounded-full">
              {activeCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="p-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Date Range Filter */}
        <FilterDropdown
          id="dateRange"
          title="Date Range"
          icon={<Calendar className="w-4 h-4" />}
          activeCount={(filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0)}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </FilterDropdown>

        {/* Event Types Filter */}
        <FilterDropdown
          id="eventTypes"
          title="Event Types"
          icon={<Tag className="w-4 h-4" />}
          activeCount={filters.eventTypes.length}
        >
          <div className="space-y-2">
            {uniqueEventTypes.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.eventTypes.includes(type)}
                  onChange={(e) => handleEventTypeChange(type, e.target.checked)}
                  className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </FilterDropdown>

        {/* Theatre Companies Filter */}
        <FilterDropdown
          id="theatreCompanies"
          title="Theatre Companies"
          icon={<Users className="w-4 h-4" />}
          activeCount={filters.theatreCompanies.length}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uniqueTheatreCompanies.map(company => (
              <label key={company} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.theatreCompanies.includes(company)}
                  onChange={(e) => handleTheatreCompanyChange(company, e.target.checked)}
                  className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{company}</span>
              </label>
            ))}
          </div>
        </FilterDropdown>

        {/* Theatre Venues Filter */}
        <FilterDropdown
          id="theatreVenues"
          title="Theatre Venues"
          icon={<Building className="w-4 h-4" />}
          activeCount={filters.theatres.length}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uniqueTheatreVenues.map(venue => (
              <label key={venue} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.theatres.includes(venue)}
                  onChange={(e) => handleTheatreVenueChange(venue, e.target.checked)}
                  className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{venue}</span>
              </label>
            ))}
          </div>
        </FilterDropdown>

        {/* Accessibility Filter */}
        <FilterDropdown
          id="accessibility"
          title="Accessibility"
          icon={<Accessibility className="w-4 h-4" />}
          activeCount={filters.signLanguageInterpreting ? 1 : 0}
        >
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.signLanguageInterpreting || false}
                onChange={(e) => onFiltersChange({ ...filters, signLanguageInterpreting: e.target.checked || undefined })}
                className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Sign Language Interpreting Available</span>
            </label>
          </div>
        </FilterDropdown>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Clear All ({activeFilterCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;



