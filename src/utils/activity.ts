import { supabase } from '../lib/supabase';
import { parseLocalDate, toKansasCityDateString, toLocalDateString } from './date';

export interface DailyVisit {
  visit_date: string;
  visits: number;
}

const previewStorageKey = 'kclt-local-preview-visits';

const getPreviewVisits = (): DailyVisit[] => {
  try {
    return JSON.parse(localStorage.getItem(previewStorageKey) || '[]') as DailyVisit[];
  } catch {
    return [];
  }
};

const recordPreviewVisit = (today: string) => {
  const visits = getPreviewVisits();
  const existing = visits.find(item => item.visit_date === today);

  if (existing) {
    existing.visits += 1;
  } else {
    visits.push({ visit_date: today, visits: 1 });
  }

  localStorage.setItem(previewStorageKey, JSON.stringify(visits));
};

export const recordDailyVisit = async () => {
  const today = toKansasCityDateString(new Date());
  const sessionKey = `kclt-visit-${today}`;

  if (sessionStorage.getItem(sessionKey)) {
    return;
  }

  // Mark immediately so React StrictMode cannot record the same visit twice.
  sessionStorage.setItem(sessionKey, 'recording');

  if (import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    recordPreviewVisit(today);
    sessionStorage.setItem(sessionKey, 'recorded');
    return;
  }

  const { error } = await supabase.rpc('record_daily_visit');

  if (error) {
    sessionStorage.removeItem(sessionKey);
    console.info('Visit tracking is temporarily unavailable.', error.message);
    return;
  }
  sessionStorage.setItem(sessionKey, 'recorded');
};

export const fetchDailyVisits = async (days = 90) => {
  const start = parseLocalDate(toKansasCityDateString(new Date()));
  start.setDate(start.getDate() - (days - 1));

  if (import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return { visits: getPreviewVisits(), isLocalPreview: true };
  }

  const { data, error } = await supabase
    .from('daily_visits')
    .select('visit_date, visits')
    .gte('visit_date', toLocalDateString(start))
    .order('visit_date', { ascending: true });

  if (error) {
    throw error;
  }

  return { visits: (data || []) as DailyVisit[], isLocalPreview: false };
};
