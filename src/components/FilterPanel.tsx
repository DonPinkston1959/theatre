import React from 'react';
import { Filter, Calendar, Clock, Building, Tag, X, Accessibility, Users } from 'lucide-react';
import { FilterOptions, Theatre } from '../types';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  theatres: Theatre[];
  isOpen: boolean;
  onToggle: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  theatres,
  isOpen,
  onToggle
}) => {
  const eventTypes = ['Play', 'Musical', 'Comedy', 'Drama', 'Children', 'Opera', 'Dance', 'Performance', 'Other'];
  const timeOptions = [
    { value: 'all', label: 'All Times' },
    { value: 'morning', label: 'Morning (before 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (12-5 PM)' },
    { value: 'evening', label: 'Evening (after 5 PM)' }
  ];

  const handleTheatreCompanyChange = (theatreCompany: string, checked: boolean) => {
    const newTheatreCompanies = checked
      ? [...filters.theatreCompanies, theatreCompany]
      : filters.theatreCompanies.filter(t => t !== theatreCompany);
    
    onFiltersChange({ ...filters, theatreCompanies: newTheatreCompanies });
  };

  const handleTheatreChange = (theatreName: string, checked: boolean) => {
    const newTheatres = checked
      ? [...filters.theatres, theatreName]
      : filters.theatres.filter(t => t !== theatreName);
    
    onFiltersChange({ ...filters, theatres: newTheatres });
  };

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    const newEventTypes = checked
      ? [...filters.eventTypes, eventType]
      : filters.eventTypes.filter(t => t !== eventType);
    
    onFiltersChange({ ...filters, eventTypes: newEventTypes });
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
    (filters.timeOfDay !== 'all' ? 1 : 0) +
    (filters.signLanguageInterpreting ? 1 : 0);

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-red-800 text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`
        lg:block lg:static lg:w-auto lg:bg-transparent lg:shadow-none lg:rounded-none
        ${isOpen ? 'block' : 'hidden'}
        fixed inset-0 z-40 bg-black bg-opacity-50 lg:bg-opacity-0
      `}>
        <div className={`
          lg:static lg:w-72 lg:bg-white lg:rounded-lg lg:shadow-lg lg:p-6
          fixed right-0 top-0 h-full w-80 bg-white shadow-xl p-6 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile Header */}
          <div className="lg:hidden flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Time of Day
              </h3>
              <select
                value={filters.timeOfDay || 'all'}
                onChange={(e) => onFiltersChange({ ...filters, timeOfDay: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Types */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Event Types
              </h3>
              <div className="space-y-2">
                {eventTypes.map(type => (
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
            </div>

            {/* Theatre Companies */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Theatre Companies
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(new Set(theatres.map(t => t.name))).sort().map(company => (
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
            </div>

            {/* Theatres */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Theatre Venues
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(new Set(
                  theatres.flatMap(t => [t.name, ...(t.address ? [t.address.split(',')[0]] : [])])
                )).filter(Boolean).sort().map(venue => (
                  <label key={venue} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.theatres.includes(venue)}
                      onChange={(e) => handleTheatreChange(venue, e.target.checked)}
                      className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{venue}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Accessibility className="w-4 h-4 mr-2" />
                Accessibility
              </h3>
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
            </div>
          </div>

          {/* Mobile Clear Button */}
          {activeFilterCount > 0 && (
            <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FilterPanel;