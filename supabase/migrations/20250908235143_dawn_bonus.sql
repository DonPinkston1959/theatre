/*
  # Allow multiple performances on the same day

  The later unique_event_details constraint includes the performance time, so
  the earlier three-column constraint is both redundant and too restrictive.
*/

ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_title_theatre_date_unique;
