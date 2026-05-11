import { getSupabaseClient } from './client';
import type { PropertyPhoto, PropertyPhotoType, PropertyPhotoCount, PhotoUploadResult } from '@/lib/caretaker/types';

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

const STORAGE_BUCKET = 'property-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Get public URL base from environment or default
const getStoragePublicUrl = (): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}`;
  }
  return '';
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` 
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Max size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }
  
  return { valid: true };
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getFileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext || 'jpg';
}

// ============================================================================
// STORAGE PATH BUILDERS
// ============================================================================

/**
 * Build deterministic storage path for property photos
 * Pattern: property-photos/{property_id}/cover.{ext}
 *          property-photos/{property_id}/gate.{ext}
 *          property-photos/{property_id}/gallery/photo-01.{ext}
 */
export function buildStoragePath(
  propertyId: string,
  photoType: PropertyPhotoType,
  displayOrder: number,
  fileExtension: string
): string {
  const sanitizedExt = fileExtension.replace(/[^a-z0-9]/g, '');
  const safeExt = sanitizedExt || 'jpg';
  
  switch (photoType) {
    case 'COVER':
      return `${propertyId}/cover.${safeExt}`;
    case 'GATE':
      return `${propertyId}/gate.${safeExt}`;
    case 'GALLERY':
      // Gallery photos are numbered 01-08
      const paddedOrder = Math.min(Math.max(displayOrder - 2, 1), 8).toString().padStart(2, '0');
      return `${propertyId}/gallery/photo-${paddedOrder}.${safeExt}`;
    default:
      return `${propertyId}/gallery/photo-01.${safeExt}`;
  }
}

/**
 * Get public URL for a storage path
 */
export function getPublicUrl(storagePath: string): string {
  const baseUrl = getStoragePublicUrl();
  if (!baseUrl) return '';
  return `${baseUrl}/${storagePath}`;
}

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

/**
 * Upload a property photo to Supabase Storage and create DB record
 */
export async function uploadPropertyPhoto(
  propertyId: string,
  file: File,
  photoType: PropertyPhotoType,
  displayOrder: number,
  altText?: string
): Promise<PhotoUploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if property exists
    if (!propertyId) {
      return { success: false, error: 'Property ID is required' };
    }

    const supabase = getSupabaseClient();
    const ext = getFileExtension(file.name);
    const storagePath = buildStoragePath(propertyId, photoType, displayOrder, ext);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists (for replace scenarios)
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    // Insert DB record
    const { data: photoData, error: dbError } = await supabase
      .from('property_photos')
      .insert({
        property_id: propertyId,
        storage_bucket: STORAGE_BUCKET,
        storage_path: storagePath,
        photo_type: photoType,
        display_order: displayOrder,
        alt_text: altText || null,
        mime_type: file.type,
        size_bytes: file.size,
        photo_url: urlData.publicUrl, // Keep for backward compatibility
      } as any)
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return { success: false, error: `Database error: ${dbError.message}` };
    }

    return {
      success: true,
      photo: {
        ...(photoData as PropertyPhoto),
        publicUrl: urlData.publicUrl,
      },
    };
  } catch (error) {
    console.error('Upload property photo error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    };
  }
}

/**
 * Delete a property photo (storage + DB)
 */
export async function deletePropertyPhoto(
  photoId: string,
  storagePath?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Get photo info if storage path not provided
    let path = storagePath;
    if (!path) {
      const { data: photo, error: fetchError } = await (supabase
        .from('property_photos') as any)
        .select('storage_path')
        .eq('id', photoId)
        .single();

      if (fetchError || !photo) {
        return { success: false, error: 'Photo not found' };
      }
      path = (photo as any).storage_path;
    }

    // Delete from storage
    if (path) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue to delete DB record even if storage delete fails
      }
    }

    // Delete DB record
    const { error: dbError } = await (supabase
      .from('property_photos') as any)
      .delete()
      .eq('id', photoId);

    if (dbError) {
      return { success: false, error: `Database error: ${dbError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete property photo error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown delete error' 
    };
  }
}

/**
 * List all photos for a property
 */
export async function listPropertyPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('property_photos')
      .select('*')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('List property photos error:', error);
      return [];
    }

    // Add public URLs
    return (data || []).map((photo: any) => ({
      ...photo,
      publicUrl: getPublicUrl(photo.storage_path),
    }));
  } catch (error) {
    console.error('List property photos error:', error);
    return [];
  }
}

/**
 * Get cover photo for a property
 */
export async function getPropertyCoverPhoto(propertyId: string): Promise<PropertyPhoto | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('property_photos')
      .select('*')
      .eq('property_id', propertyId)
      .eq('photo_type', 'COVER')
      .maybeSingle();

    if (error || !data) return null;

    return {
      ...(data as any),
      publicUrl: getPublicUrl((data as any).storage_path),
    };
  } catch (error) {
    console.error('Get cover photo error:', error);
    return null;
  }
}

/**
 * Get all photos for property carousel (cover + gate + gallery in order)
 */
export async function getPropertyCarouselPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('property_photos')
      .select('*')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Get carousel photos error:', error);
      return [];
    }

    return (data || []).map((photo: any) => ({
      ...photo,
      publicUrl: getPublicUrl(photo.storage_path),
    }));
  } catch (error) {
    console.error('Get carousel photos error:', error);
    return [];
  }
}

/**
 * Get photo count for a property
 */
export async function getPropertyPhotoCount(propertyId: string): Promise<PropertyPhotoCount> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await (supabase as any)
      .rpc('get_property_photo_count', { p_property_id: propertyId });

    if (error || !data) {
      return { total_count: 0, has_cover: false, has_gate: false, gallery_count: 0 };
    }

    return data[0] as PropertyPhotoCount;
  } catch (error) {
    console.error('Get photo count error:', error);
    return { total_count: 0, has_cover: false, has_gate: false, gallery_count: 0 };
  }
}

/**
 * Reorder gallery photos after deletion
 */
export async function reorderPropertyPhotos(propertyId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await (supabase as any)
      .rpc('reorder_property_photos', { p_property_id: propertyId });

    if (error) {
      console.error('Reorder photos error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Reorder photos error:', error);
    return false;
  }
}

/**
 * Replace an existing photo (keeps same ID and order)
 */
export async function replacePropertyPhoto(
  photoId: string,
  file: File
): Promise<PhotoUploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = getSupabaseClient();

    // Get existing photo info
    const { data: existingPhoto, error: fetchError } = await (supabase
      .from('property_photos') as any)
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError || !existingPhoto) {
      return { success: false, error: 'Photo not found' };
    }

    // Upload new file (overwrites due to upsert)
    const ext = getFileExtension(file.name);
    const newStoragePath = buildStoragePath(
      (existingPhoto as any).property_id,
      (existingPhoto as any).photo_type as PropertyPhotoType,
      (existingPhoto as any).display_order,
      ext
    );

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(newStoragePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get new public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(newStoragePath);

    // Update DB record
    const { data: updatedPhoto, error: updateError } = await (supabase
      .from('property_photos') as any)
      .update({
        storage_path: newStoragePath,
        mime_type: file.type,
        size_bytes: file.size,
        photo_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', photoId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: `Update failed: ${updateError.message}` };
    }

    return {
      success: true,
      photo: {
        ...(updatedPhoto as PropertyPhoto),
        publicUrl: urlData.publicUrl,
      },
    };
  } catch (error) {
    console.error('Replace property photo error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown replace error' 
    };
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Upload multiple gallery photos at once
 */
export async function uploadGalleryPhotos(
  propertyId: string,
  files: File[],
  startOrder: number = 3
): Promise<{ success: boolean; results: PhotoUploadResult[]; error?: string }> {
  const results: PhotoUploadResult[] = [];
  
  if (files.length === 0) {
    return { success: true, results };
  }

  // Check if we'll exceed 10 photos
  const supabase = getSupabaseClient();
  const { data: existingCount } = await (supabase
    .from('property_photos') as any)
    .select('id', { count: 'exact' })
    .eq('property_id', propertyId);

  const currentCount = existingCount?.length || 0;
  if (currentCount + files.length > 10) {
    return { 
      success: false, 
      results,
      error: `Cannot upload ${files.length} photos. Only ${10 - currentCount} slots remaining (max 10).` 
    };
  }

  // Upload each file sequentially to maintain order
  for (let i = 0; i < files.length; i++) {
    const displayOrder = startOrder + i;
    if (displayOrder > 10) break;

    const result = await uploadPropertyPhoto(
      propertyId,
      files[i],
      'GALLERY',
      displayOrder,
      `Gallery photo ${i + 1}`
    );
    results.push(result);
  }

  const allSuccess = results.every(r => r.success);
  return { 
    success: allSuccess, 
    results,
    error: allSuccess ? undefined : 'Some uploads failed' 
  };
}
