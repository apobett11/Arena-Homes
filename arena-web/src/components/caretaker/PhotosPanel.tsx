"use client";

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { 
  Upload, Trash2, Image as ImageIcon, AlertCircle, 
  CheckCircle2, X, Camera, Home, DoorOpen 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyPhoto, PropertyPhotoType } from "@/lib/caretaker/types";
import {
  uploadPropertyPhoto,
  deletePropertyPhoto,
  replacePropertyPhoto,
  uploadGalleryPhotos,
  listPropertyPhotos,
  getPropertyPhotoCount,
  validateImageFile,
} from "@/lib/supabase/storage";

interface PhotosPanelProps {
  propertyId: string;
  initialPhotos?: PropertyPhoto[];
  onDataChange?: () => void;
}

interface PhotoCount {
  total: number;
  hasCover: boolean;
  hasGate: boolean;
  galleryCount: number;
}

export function PhotosPanel({ propertyId, initialPhotos = [], onDataChange }: PhotosPanelProps) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initialPhotos);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<PhotoCount>(() => {
    const hasCover = initialPhotos.some(p => p.photo_type === 'COVER');
    const hasGate = initialPhotos.some(p => p.photo_type === 'GATE');
    const galleryCount = initialPhotos.filter(p => p.photo_type === 'GALLERY').length;
    return {
      total: initialPhotos.length,
      hasCover,
      hasGate,
      galleryCount,
    };
  });

  const coverInputRef = useRef<HTMLInputElement>(null);
  const gateInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Refresh photos list
  const refreshPhotos = useCallback(async () => {
    const freshPhotos = await listPropertyPhotos(propertyId);
    setPhotos(freshPhotos);
    
    // Update count
    const freshCount = await getPropertyPhotoCount(propertyId);
    if (freshCount) {
      setCount({
        total: freshCount.total_count,
        hasCover: freshCount.has_cover,
        hasGate: freshCount.has_gate,
        galleryCount: freshCount.gallery_count,
      });
    }
    
    onDataChange?.();
  }, [propertyId, onDataChange]);

  // Handle single photo upload (cover or gate)
  const handleSingleUpload = async (
    file: File, 
    photoType: PropertyPhotoType, 
    displayOrder: number,
    existingPhotoId?: string
  ) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(prev => ({ ...prev, [photoType]: true }));
    setError(null);

    try {
      let result;
      
      if (existingPhotoId) {
        // Replace existing photo
        result = await replacePropertyPhoto(existingPhotoId, file);
      } else {
        // Upload new photo
        result = await uploadPropertyPhoto(
          propertyId,
          file,
          photoType,
          displayOrder,
          photoType === 'COVER' ? 'Cover photo' : photoType === 'GATE' ? 'Gate photo' : 'Gallery photo'
        );
      }

      if (result.success) {
        await refreshPhotos();
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [photoType]: false }));
    }
  };

  // Handle gallery multiple upload
  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check available slots
    const availableSlots = 10 - count.total;
    if (availableSlots <= 0) {
      setError('Maximum 10 photos allowed. Delete some photos first.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    
    setLoading(true);
    setError(null);

    try {
      // Calculate starting order for gallery photos
      const startOrder = count.hasCover && count.hasGate 
        ? Math.max(3, count.galleryCount + 3)
        : count.hasCover 
          ? Math.max(2, count.galleryCount + 2)
          : count.hasGate
            ? Math.max(2, count.galleryCount + 2)
            : Math.max(1, count.galleryCount + 1);

      const result = await uploadGalleryPhotos(propertyId, filesToUpload, startOrder);
      
      if (result.success) {
        await refreshPhotos();
      } else {
        setError(result.error || 'Some uploads failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle photo deletion
  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    setLoading(true);
    setError(null);

    try {
      const result = await deletePropertyPhoto(photoId);
      if (result.success) {
        await refreshPhotos();
      } else {
        setError(result.error || 'Delete failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Get photo by type
  const getPhotoByType = (type: PropertyPhotoType) => {
    return photos.find(p => p.photo_type === type);
  };

  // Get gallery photos sorted
  const getGalleryPhotos = () => {
    return photos
      .filter(p => p.photo_type === 'GALLERY')
      .sort((a, b) => a.display_order - b.display_order);
  };

  const coverPhoto = getPhotoByType('COVER');
  const gatePhoto = getPhotoByType('GATE');
  const galleryPhotos = getGalleryPhotos();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Property Photos</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage photos for your property listing
          </p>
        </div>
        <div className="text-right rounded-xl bg-white/86 px-4 py-2 shadow-sm ring-1 ring-slate-200">
          <span className={cn(
            "text-2xl font-bold",
            count.total === 10 ? "text-emerald-600" : "text-amber-600"
          )}>
            {count.total}/10
          </span>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">photos uploaded</p>
        </div>
      </div>

      {/* Photo Count Warning */}
      {count.total < 10 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-start gap-3 shadow-sm ring-1 ring-red-500/10">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-rose-400">
              This property has {count.total}/10 photos. Upload all 10 photos for best listing performance.
            </p>
            {!count.hasCover && (
              <p className="text-xs font-medium text-red-600 dark:text-rose-300 mt-1">
                • Cover photo is required for listing cards
              </p>
            )}
            {!count.hasGate && (
              <p className="text-xs font-medium text-red-600 dark:text-rose-300 mt-1">
                • Gate photo helps tenants locate the property
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success State */}
      {count.total === 10 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 shadow-sm ring-1 ring-emerald-500/10">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            All 10 photos uploaded! Your listing is fully optimized.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-3 flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto rounded-lg p-1 text-red-500 hover:bg-red-100 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cover Photo Section */}
      <div className="caretaker-card p-4 bg-[linear-gradient(180deg,#ffffff,#eff6ff)]">
        <div className="flex items-center gap-2 mb-3">
          <Home className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-950 dark:text-white">Cover Photo</h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">(Required - shown on listing cards)</span>
        </div>

        {coverPhoto ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
            <Image
              src={coverPhoto.publicUrl || ''}
              alt="Cover photo"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading['COVER']}
                className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-100 transition-colors"
              >
                {uploading['COVER'] ? 'Uploading...' : 'Replace'}
              </button>
              <button
                onClick={() => handleDelete(coverPhoto.id)}
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
              Cover (1/10)
            </div>
          </div>
        ) : (
          <div 
            onClick={() => coverInputRef.current?.click()}
            className="aspect-video rounded-lg border-2 border-dashed border-blue-200 bg-white/70 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Camera className="w-8 h-8 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Click to upload cover photo</span>
            <span className="text-xs text-slate-400">JPG, PNG, WebP (max 10MB)</span>
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleSingleUpload(file, 'COVER', 1, coverPhoto?.id);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {/* Gate Photo Section */}
      <div className="caretaker-card p-4 bg-[linear-gradient(180deg,#ffffff,#ecfdf5)]">
        <div className="flex items-center gap-2 mb-3">
          <DoorOpen className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-950 dark:text-white">Gate Photo</h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">(Recommended - helps tenants find entrance)</span>
        </div>

        {gatePhoto ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
            <Image
              src={gatePhoto.publicUrl || ''}
              alt="Gate photo"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => gateInputRef.current?.click()}
                disabled={uploading['GATE']}
                className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-100 transition-colors"
              >
                {uploading['GATE'] ? 'Uploading...' : 'Replace'}
              </button>
              <button
                onClick={() => handleDelete(gatePhoto.id)}
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
            <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded">
              Gate (2/10)
            </div>
          </div>
        ) : (
          <div 
            onClick={() => gateInputRef.current?.click()}
            className="aspect-video rounded-lg border-2 border-dashed border-emerald-200 bg-white/70 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <Camera className="w-8 h-8 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Click to upload gate photo</span>
            <span className="text-xs text-slate-400">JPG, PNG, WebP (max 10MB)</span>
          </div>
        )}
        <input
          ref={gateInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleSingleUpload(file, 'GATE', 2, gatePhoto?.id);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {/* Gallery Photos Section */}
      <div className="caretaker-card p-4 bg-[linear-gradient(180deg,#ffffff,#f5f3ff)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-950 dark:text-white">Interior Photos</h3>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">({galleryPhotos.length}/8)</span>
          </div>
          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={loading || count.total >= 10}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-[0_10px_20px_rgba(124,58,237,0.2)] hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Multiple
          </button>
        </div>

        {/* Gallery Grid */}
        {galleryPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {galleryPhotos.map((photo, idx) => (
              <div 
                key={photo.id} 
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 group"
              >
                <Image
                  src={photo.publicUrl || ''}
                  alt={`Interior photo ${idx + 1}`}
                  fill
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={loading}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] font-medium rounded">
                  {photo.display_order}/10
                </div>
              </div>
            ))}
            {/* Empty slots placeholder */}
            {Array.from({ length: Math.max(0, 8 - galleryPhotos.length) }).map((_, idx) => (
              <div 
                key={`empty-${idx}`}
                className="aspect-square rounded-lg border-2 border-dashed border-purple-200 bg-white/60 flex items-center justify-center"
              >
                <span className="text-xs text-slate-300 dark:text-slate-600">
                  {galleryPhotos.length + idx + 3}/10
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div 
            onClick={() => galleryInputRef.current?.click()}
            className="h-32 rounded-lg border-2 border-dashed border-purple-200 bg-white/70 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <Upload className="w-8 h-8 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Upload interior photos</span>
            <span className="text-xs text-slate-400">Select multiple files (max 8)</span>
          </div>
        )}

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            handleGalleryUpload(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />

        {/* Gallery Help Text */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
          Upload photos of rooms, kitchen, bathroom, and other interior spaces. 
          These appear in the property carousel after cover and gate photos.
        </p>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span className="text-slate-700 dark:text-slate-300">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
