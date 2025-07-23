-- Create storage buckets for images

-- Create profiles bucket for user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create dogs bucket for dog images  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dogs',
  'dogs', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create general images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit  
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for profiles bucket
CREATE POLICY "Users can upload their own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Profile images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

-- RLS policies for dogs bucket
CREATE POLICY "Authenticated users can upload dog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dogs'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update dog images they uploaded" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'dogs'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can delete dog images they uploaded" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'dogs'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Dog images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'dogs');

-- RLS policies for general images bucket
CREATE POLICY "Authenticated users can upload general images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update general images they uploaded" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can delete general images they uploaded" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "General images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');