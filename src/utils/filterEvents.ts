import { FilterOptions, TheatreEvent } from '../types';

type FilterDimension = 'theatreCompanies' | 'theatres' | 'eventTypes';

const matchesTimeOfDay = (time: string, preference?: FilterOptions['timeOfDay']) => {
  if (!preference || preference === 'all') {
    return true;
  }

  const [hoursRaw] = time.split(':');
  const hours = Number.parseInt(hoursRaw, 10);

  if (Number.isNaN(hours)) {
    return true;
  }

  switch (preference) {
    case 'morning':
      return hours < 12;
    case 'afternoon':
      return hours >= 12 && hours < 17;
    case 'evening':
      return hours >= 17;
    default:
      return true;
  }
};

export const filterEvents = (events: TheatreEvent[], filters: FilterOptions) => {
  let filtered = [...events];

  if (filters.theatreCompanies && filters.theatreCompanies.length > 0) {
    const selected = new Set(filters.theatreCompanies);
    filtered = filtered.filter(event => selected.has(event.theatreName));
  }

  if (filters.theatres && filters.theatres.length > 0) {
    const selected = new Set(filters.theatres);
    filtered = filtered.filter(event => selected.has(event.venue || event.theatreName));
  }

  if (filters.eventTypes && filters.eventTypes.length > 0) {
    const selected = new Set(filters.eventTypes);
    filtered = filtered.filter(event => selected.has(event.eventType));
  }

  if (filters.startDate) {
    filtered = filtered.filter(event => event.date >= filters.startDate!);
  }

  if (filters.endDate) {
    filtered = filtered.filter(event => event.date <= filters.endDate!);
  }

  filtered = filtered.filter(event => matchesTimeOfDay(event.time, filters.timeOfDay));

  if (filters.signLanguageInterpreting) {
    filtered = filtered.filter(event => event.signLanguageInterpreting === true);
  }

  return filtered;
};

export const filterEventsExcluding = (
  events: TheatreEvent[],
  filters: FilterOptions,
  exclude: FilterDimension | FilterDimension[] = []
) => {
  const exclusions = Array.isArray(exclude) ? exclude : [exclude];

  const adjustedFilters: FilterOptions = {
    ...filters,
    theatreCompanies: exclusions.includes('theatreCompanies') ? [] : [...filters.theatreCompanies],
    theatres: exclusions.includes('theatres') ? [] : [...filters.theatres],
    eventTypes: exclusions.includes('eventTypes') ? [] : [...filters.eventTypes]
  };

  return filterEvents(events, adjustedFilters);
};
