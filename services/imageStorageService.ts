import { supabase } from './supabaseService';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const imageStorageService = {
  /**
   * Upload image to Supabase Storage and return permanent URL
   */
  async uploadImage(file: File, userId: string): Promise<ImageUploadResult> {
    try {
      console.log('📸 Starting image upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId
      });

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log('📁 Generated filename:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`
        };
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        console.error('❌ Failed to get public URL');
        return {
          success: false,
          error: 'Failed to get public URL'
        };
      }

      console.log('🔗 Public URL generated:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error: any) {
      console.error('❌ Image upload error:', error);
      return {
        success: false,
        error: error.message || 'Unknown upload error'
      };
    }
  },

  /**
   * Upload base64 image data to Supabase Storage
   */
  async uploadBase64Image(base64Data: string, mimeType: string, userId: string): Promise<ImageUploadResult> {
    try {
      console.log('📸 Starting base64 image upload:', {
        dataLength: base64Data.length,
        mimeType,
        userId
      });

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Create file from blob
      const fileExt = mimeType.split('/')[1] || 'jpg';
      const file = new File([blob], `meal-${Date.now()}.${fileExt}`, { type: mimeType });

      // Use existing upload method
      return await this.uploadImage(file, userId);

    } catch (error: any) {
      console.error('❌ Base64 upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process base64 image'
      };
    }
  },

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (!fileName) {
        console.warn('⚠️ Could not extract filename from URL:', imageUrl);
        return false;
      }

      const { error } = await supabase.storage
        .from('meal-images')
        .remove([fileName]);

      if (error) {
        console.error('❌ Delete error:', error);
        return false;
      }

      console.log('🗑️ Image deleted successfully:', fileName);
      return true;

    } catch (error) {
      console.error('❌ Image deletion error:', error);
      return false;
    }
  },

  /**
   * Create storage bucket if it doesn't exist (for setup)
   */
  async ensureStorageBucket(): Promise<boolean> {
    try {
      console.log('🪣 Checking storage bucket...');

      // Try to list files in bucket (this will fail if bucket doesn't exist)
      const { data, error } = await supabase.storage
        .from('meal-images')
        .list('', { limit: 1 });

      if (error && (error.message.includes('not found') || error.message.includes('does not exist'))) {
        console.log('🪣 Attempting to create storage bucket...');
        
        // Try to create bucket (may fail due to permissions)
        const { error: createError } = await supabase.storage
          .createBucket('meal-images', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
            fileSizeLimit: 5242880 // 5MB
          });

        if (createError) {
          console.warn('⚠️ Could not create bucket via API (this is normal):', createError.message);
          console.log('📋 Please create the bucket manually in Supabase Dashboard');
          return false;
        }

        console.log('✅ Storage bucket created successfully via API');
      } else if (error) {
        console.error('❌ Storage bucket check error:', error);
        return false;
      } else {
        console.log('✅ Storage bucket already exists');
      }

      return true;

    } catch (error) {
      console.error('❌ Storage bucket setup error:', error);
      return false;
    }
  }
};

export default imageStorageService;