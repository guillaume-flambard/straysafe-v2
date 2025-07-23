import { supabase } from '@/lib/supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface ImageUploadOptions {
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

class ImageUploadService {
  private static instance: ImageUploadService;
  
  public static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  // Compress and resize image
  private async processImage(
    uri: string, 
    options: ImageUploadOptions = {}
  ): Promise<string> {
    const {
      compress = true,
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    if (!compress) return uri;

    try {
      const manipulatorResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: maxWidth, height: maxHeight } }
        ],
        {
          compress: quality,
          format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
          base64: false
        }
      );

      return manipulatorResult.uri;
    } catch (error) {
      console.error('Error processing image:', error);
      return uri; // Return original if processing fails
    }
  }

  // Generate unique filename
  private generateFileName(userId: string, type: 'profile' | 'dog' | 'general' = 'general'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${type}/${userId}/${timestamp}_${random}.jpg`;
  }

  // Upload image to Supabase Storage
  async uploadImage(
    uri: string,
    userId: string,
    bucket: string = 'images',
    type: 'profile' | 'dog' | 'general' = 'general',
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      console.log('🖼️ Starting image upload:', { uri, userId, bucket, type });

      // Process image (compress/resize)
      const processedUri = await this.processImage(uri, options);
      console.log('📐 Image processed:', processedUri);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: 'base64',
      });

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Generate unique file path
      const fileName = this.generateFileName(userId, type);
      console.log('📁 Generated filename:', fileName);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      console.log('✅ Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      };

    } catch (error) {
      console.error('❌ Image upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  // Upload profile image
  async uploadProfileImage(
    uri: string,
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    return this.uploadImage(uri, userId, 'profiles', 'profile', {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
      ...options
    });
  }

  // Upload dog image
  async uploadDogImage(
    uri: string,
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    return this.uploadImage(uri, userId, 'dogs', 'dog', {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.9,
      ...options
    });
  }

  // Delete image from storage
  async deleteImage(path: string, bucket: string = 'images'): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      console.log('Image deleted successfully:', path);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  // Get image URL from path
  getImageUrl(path: string, bucket: string = 'images'): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Update image (delete old, upload new)
  async updateImage(
    newUri: string,
    oldPath: string | null,
    userId: string,
    bucket: string = 'images',
    type: 'profile' | 'dog' | 'general' = 'general',
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      // Upload new image first
      const uploadResult = await this.uploadImage(newUri, userId, bucket, type, options);
      
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Delete old image if it exists
      if (oldPath) {
        await this.deleteImage(oldPath, bucket);
      }

      return uploadResult;
    } catch (error) {
      console.error('Error updating image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update image'
      };
    }
  }
}

// Export singleton instance
export const imageUploadService = ImageUploadService.getInstance();

// Convenience functions
export const uploadProfileImage = (uri: string, userId: string, options?: ImageUploadOptions) =>
  imageUploadService.uploadProfileImage(uri, userId, options);

export const uploadDogImage = (uri: string, userId: string, options?: ImageUploadOptions) =>
  imageUploadService.uploadDogImage(uri, userId, options);

export const deleteImage = (path: string, bucket?: string) =>
  imageUploadService.deleteImage(path, bucket);

export const getImageUrl = (path: string, bucket?: string) =>
  imageUploadService.getImageUrl(path, bucket);