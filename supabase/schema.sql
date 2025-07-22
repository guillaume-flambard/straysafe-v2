-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create locations table
CREATE TABLE locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'volunteer', 'vet', 'viewer')),
  location_id UUID REFERENCES locations(id),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dogs table
CREATE TABLE dogs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('stray', 'fostered', 'adopted', 'deceased')),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
  location_id UUID REFERENCES locations(id) NOT NULL,
  breed TEXT,
  age INTEGER,
  description TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  last_seen_location TEXT,
  medical_notes TEXT,
  is_neutered BOOLEAN DEFAULT FALSE,
  is_vaccinated BOOLEAN DEFAULT FALSE,
  main_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('medical', 'location', 'status', 'note')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES users(id) NOT NULL,
  recipient_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  dog_id UUID REFERENCES dogs(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_1_id UUID REFERENCES users(id) NOT NULL,
  participant_2_id UUID REFERENCES users(id) NOT NULL,
  dog_id UUID REFERENCES dogs(id),
  last_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id, dog_id)
);

-- Create indexes for better performance
CREATE INDEX idx_dogs_status ON dogs(status);
CREATE INDEX idx_dogs_location ON dogs(location_id);
CREATE INDEX idx_dogs_created_at ON dogs(created_at);
CREATE INDEX idx_events_dog_id ON events(dog_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for dogs table
CREATE POLICY "Anyone can view dogs" ON dogs
  FOR SELECT USING (true);

CREATE POLICY "Volunteers and above can create dogs" ON dogs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'volunteer', 'vet')
    )
  );

CREATE POLICY "Volunteers and above can update dogs" ON dogs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'volunteer', 'vet')
    )
  );

CREATE POLICY "Only admins can delete dogs" ON dogs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for events table
CREATE POLICY "Anyone can view public events" ON events
  FOR SELECT USING (is_private = false);

CREATE POLICY "Users can view private events they created" ON events
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Vets can view medical events" ON events
  FOR SELECT USING (
    type = 'medical' AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'vet')
    )
  );

CREATE POLICY "Volunteers and above can create events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'volunteer', 'vet')
    )
  );

-- RLS Policies for messages table
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- RLS Policies for conversations table
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  );

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON dogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, location_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'viewer',
    (SELECT id FROM locations LIMIT 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial data
INSERT INTO locations (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Koh Phangan', 'Island in the Gulf of Thailand'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Chiang Mai', 'Northern Thailand'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bangkok', 'Capital city of Thailand');