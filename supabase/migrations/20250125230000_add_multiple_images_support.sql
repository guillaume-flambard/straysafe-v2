-- Add support for multiple images per dog
-- Created: 2025-01-25 23:00:00

-- Dog images table for multiple photos
CREATE TABLE IF NOT EXISTS dog_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 0,
  caption TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dog_images_dog_id ON dog_images(dog_id);
CREATE INDEX IF NOT EXISTS idx_dog_images_order ON dog_images(dog_id, image_order);
CREATE INDEX IF NOT EXISTS idx_dog_images_main ON dog_images(dog_id, is_main);

-- Enable RLS
ALTER TABLE dog_images ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Anyone can view dog images" ON dog_images;
DROP POLICY IF EXISTS "Authenticated users can manage dog images" ON dog_images;

CREATE POLICY "Anyone can view dog images" ON dog_images
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage dog images" ON dog_images
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Function to ensure only one main image per dog
CREATE OR REPLACE FUNCTION ensure_single_main_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this image as main, unset all other main images for this dog
  IF NEW.is_main = TRUE THEN
    UPDATE dog_images 
    SET is_main = FALSE 
    WHERE dog_id = NEW.dog_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for main image constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_single_main_image_trigger') THEN
        CREATE TRIGGER ensure_single_main_image_trigger
          BEFORE INSERT OR UPDATE ON dog_images
          FOR EACH ROW EXECUTE FUNCTION ensure_single_main_image();
    END IF;
END $$;

-- Function to auto-update main_image in dogs table when main image changes
CREATE OR REPLACE FUNCTION update_dog_main_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the dogs table main_image when a new main image is set
  IF NEW.is_main = TRUE THEN
    UPDATE dogs 
    SET main_image = NEW.image_url 
    WHERE id = NEW.dog_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update dogs table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dog_main_image_trigger') THEN
        CREATE TRIGGER update_dog_main_image_trigger
          AFTER INSERT OR UPDATE ON dog_images
          FOR EACH ROW EXECUTE FUNCTION update_dog_main_image();
    END IF;
END $$;

-- View: Dogs with all their images
CREATE OR REPLACE VIEW dogs_with_images AS
SELECT 
  d.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', di.id,
        'image_url', di.image_url,
        'image_order', di.image_order,
        'caption', di.caption,
        'is_main', di.is_main,
        'uploaded_by', di.uploaded_by,
        'created_at', di.created_at
      ) ORDER BY di.image_order ASC, di.created_at ASC
    ) FILTER (WHERE di.id IS NOT NULL),
    '[]'
  ) as images
FROM dogs d
LEFT JOIN dog_images di ON d.id = di.dog_id
GROUP BY d.id
ORDER BY d.created_at DESC;

-- Grant permissions
GRANT ALL ON dog_images TO authenticated;
GRANT SELECT ON dogs_with_images TO authenticated;