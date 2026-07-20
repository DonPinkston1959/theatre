import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { DailyVisit, fetchDailyVisits } from '../utils/activity';
import { parseLocalDate, toKansasCityDateString, toLocalDateString } from '../utils/date';

interface ActivityDashboardProps {
  isActive: boolean;
}

const ActivityDashboard: React.FC<ActivityDashboardProps> = ({ isActive }) => {
  const [visits, setVisits] = useState<DailyVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalPreview, setIsLocalPreview] = useState(false);

  const loadVisits = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchDailyVisits();
      setVisits(result.visits);
      setIsLocalPreview(result.isLocalPreview);
    } catch {
      setError('Activity data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      void loadVisits();
    }
  }, [isActive]);

  const totals = useMemo(() => {
    const todayString = toKansasCityDateString(new Date());
    const today = parseLocalDate(todayString);
    const sumSince = (days: number) => {
      const start = new Date(today);
      start.setDate(start.getDate() - (days - 1));
      const startDate = toLocalDateString(start);
      return visits
        .filter(item => item.visit_date >= startDate)
        .reduce((sum, item) => sum + item.visits, 0);
    };

    return {
      today: visits.find(item => item.visit_date === todayString)?.visits || 0,
      week: sumSince(7),
      month: sumSince(30)
    };
  }, [visits]);

  const recentVisits = useMemo(() => {
    const visitsByDate = new Map(visits.map(item => [item.visit_date, item.visits]));
    const today = parseLocalDate(toKansasCityDateString(new Date()));

    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (13 - index));
      const visitDate = toLocalDateString(date);
      return { visit_date: visitDate, visits: visitsByDate.get(visitDate) || 0 };
    });
  }, [visits]);
  const maxVisits = Math.max(...recentVisits.map(item => item.visits), 1);

  return (
    <section className="border-t border-gray-200 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center font-semibold text-gray-900">
          <BarChart3 className="mr-2 h-5 w-5" />
          Website Activity
        </h3>
        <button
          type="button"
          onClick={() => void loadVisits()}
          disabled={loading}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          aria-label="Refresh activity"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLocalPreview && (
        <p className="mb-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
          Local preview data only. Local testing does not affect production activity.
        </p>
      )}

      {error ? (
        <p className="text-sm text-gray-600">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Today', totals.today],
              ['7 days', totals.week],
              ['30 days', totals.month]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xl font-bold text-red-800">{value}</p>
                <p className="text-xs text-gray-600">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex h-24 items-end gap-1" aria-label="Visits during the last 14 calendar days">
            {recentVisits.map(item => (
              <div key={item.visit_date} className="group flex min-w-0 flex-1 flex-col items-center justify-end" title={`${item.visit_date}: ${item.visits} visits`}>
                <div
                  className="w-full rounded-t bg-red-700 group-hover:bg-red-800"
                  style={{ height: `${Math.max((item.visits / maxVisits) * 72, 4)}px` }}
                />
                <span className="mt-1 text-[9px] text-gray-500">{item.visit_date.slice(5)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default ActivityDashboard;
