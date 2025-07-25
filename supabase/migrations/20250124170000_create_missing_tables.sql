-- Create missing tables for the application
-- Created: 2025-01-24 17:00:00

-- Dogs table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS dogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'stray' CHECK (status IN ('stray', 'fostered', 'adopted', 'deceased')),
  gender TEXT DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
  location_id UUID,
  breed TEXT,
  age INTEGER,
  description TEXT,
  last_seen TEXT,
  last_seen_location TEXT,
  medical_notes TEXT,
  is_neutered BOOLEAN DEFAULT FALSE,
  is_vaccinated BOOLEAN DEFAULT FALSE,
  main_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID
);

-- Events table (dog events/timeline)
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('medical', 'location', 'status', 'note')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Locations table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_dogs_status ON dogs(status);
CREATE INDEX IF NOT EXISTS idx_dogs_location_id ON dogs(location_id);
CREATE INDEX IF NOT EXISTS idx_events_dog_id ON events(dog_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Enable RLS
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
DROP POLICY IF EXISTS "Anyone can view dogs" ON dogs;
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Anyone can view locations" ON locations;

CREATE POLICY "Anyone can view dogs" ON dogs FOR SELECT USING (true);
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Anyone can view locations" ON locations FOR SELECT USING (true);

-- Allow authenticated users to manage their own content
CREATE POLICY "Users can manage dogs" ON dogs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage events" ON events FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage locations" ON locations FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON dogs TO authenticated;
GRANT ALL ON events TO authenticated;
GRANT ALL ON locations TO authenticated;

-- Create some sample data if tables are empty
INSERT INTO locations (name, description) 
SELECT 'Default Location', 'Default location for dogs'
WHERE NOT EXISTS (SELECT 1 FROM locations);

-- Add a sample dog if none exist
INSERT INTO dogs (name, status, description, location_id)
SELECT 'Sample Dog', 'stray', 'A sample dog for testing', 
       (SELECT id FROM locations LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM dogs);