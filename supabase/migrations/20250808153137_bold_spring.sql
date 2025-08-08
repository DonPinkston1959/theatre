/*
  # Add Performance event type

  1. Schema Changes
    - Update event_type constraint to include 'Performance'
    - This allows events to have 'Performance' as a valid type

  2. Data Migration
    - No existing data migration needed as this is additive
*/

-- Drop the existing constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Add the new constraint with Performance included
ALTER TABLE events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type = ANY (ARRAY['Play'::text, 'Musical'::text, 'Comedy'::text, 'Drama'::text, 'Children'::text, 'Opera'::text, 'Dance'::text, 'Performance'::text, 'Other'::text]));