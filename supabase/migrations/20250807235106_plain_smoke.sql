/*
  # Create events and theatres tables

  1. New Tables
    - `theatres`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `website` (text)
      - `address` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `theatre_name` (text, not null)
      - `event_type` (text, not null, check constraint)
      - `date` (date, not null)
      - `time` (time, not null)
      - `description` (text)
      - `website_url` (text)
      - `ticket_url` (text)
      - `venue` (text)
      - `price` (text)
      - `sign_language_interpreting` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for authenticated admin access for write operations

  3. Indexes
    - Index on events.date for calendar queries
    - Index on events.theatre_name for filtering
    - Index on events.event_type for filtering
*/

-- Create theatres table
CREATE TABLE IF NOT EXISTS theatres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  website text,
  address text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  theatre_name text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('Play', 'Musical', 'Comedy', 'Drama', 'Children', 'Opera', 'Dance', 'Other')),
  date date NOT NULL,
  time time NOT NULL,
  description text DEFAULT '',
  website_url text,
  ticket_url text,
  venue text,
  price text,
  sign_language_interpreting boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE theatres ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read theatres"
  ON theatres
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read events"
  ON events
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for admin write access (will be controlled by application logic)
CREATE POLICY "Authenticated users can insert theatres"
  ON theatres
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update theatres"
  ON theatres
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_theatre_name ON events(theatre_name);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_sign_language ON events(sign_language_interpreting) WHERE sign_language_interpreting = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_theatres_updated_at 
  BEFORE UPDATE ON theatres 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO theatres (name, website, address) VALUES
  ('Kansas City Repertory Theatre', 'https://www.kcrep.org', '4949 Cherry St, Kansas City, MO 64110'),
  ('Music Hall Kansas City', 'https://www.musichallkc.org', '301 W 13th St, Kansas City, MO 64105'),
  ('The Improv Shop', 'https://www.theimprovshop.com', '18 E 18th St, Kansas City, MO 64108'),
  ('Heart of America Shakespeare Festival', 'https://www.kcshakes.org', 'Southmoreland Park, Kansas City, MO 64111'),
  ('Starlight Theatre', 'https://www.kcstarlight.com', '4600 Starlight Rd, Kansas City, MO 64132')
ON CONFLICT (name) DO NOTHING;

INSERT INTO events (title, theatre_name, event_type, date, time, description, website_url, ticket_url, venue, price, sign_language_interpreting) VALUES
  ('A Christmas Carol', 'Kansas City Repertory Theatre', 'Play', '2025-01-15', '19:30', 'A heartwarming holiday classic brought to life on stage.', 'https://www.kcrep.org', null, 'Spencer Theatre', '$25-$65', false),
  ('The Lion King', 'Music Hall Kansas City', 'Musical', '2025-01-18', '20:00', 'Disney''s award-winning musical spectacular.', 'https://www.musichallkc.org', 'https://www.tickets.com', null, '$45-$125', false),
  ('Comedy Night Live', 'The Improv Shop', 'Comedy', '2025-01-20', '21:00', 'An evening of laughs with local comedians.', 'https://www.theimprovshop.com', null, null, '$15-$25', false),
  ('Romeo and Juliet', 'Heart of America Shakespeare Festival', 'Drama', '2025-01-22', '18:00', 'Shakespeare''s timeless tragedy of young love.', 'https://www.kcshakes.org', null, 'Southmoreland Park', 'Free', true),
  ('Nutcracker Suite', 'Starlight Theatre', 'Dance', '2025-01-25', '14:00', 'Classical ballet performance for the whole family.', 'https://www.kcstarlight.com', 'https://www.tickets.com/starlight', null, '$20-$50', false);