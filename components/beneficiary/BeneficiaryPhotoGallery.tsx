/**
 * @fileoverview BeneficiaryPhotoGallery Component - Photo gallery management for beneficiaries
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Download,
  Grid,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
// Will be used in the real implementation
// import { fileStorageService } from '../../services';

export interface Photo {
  id: number;
  name: string;
  url: string;
  size: string;
  uploadDate: string;
  type: string;
}

export interface BeneficiaryPhotoGalleryProps {
  /** The beneficiary ID to associate photos with */
  beneficiaryId: string;
  /** Whether the photo gallery modal is open */
  isOpen: boolean;
  /** Callback when the modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Initial photos to display (if any) */
  initialPhotos?: Photo[];
  /** Callback when photos are updated (uploaded/deleted) */
  onPhotosChange?: (photos: Photo[]) => void;
}

/**
 * BeneficiaryPhotoGallery Component
 * 
 * Handles photo gallery management for beneficiaries including upload, preview,
 * download, and deletion of photos.
 */
export const BeneficiaryPhotoGallery: React.FC<BeneficiaryPhotoGalleryProps> = ({
  // beneficiaryId is used to associate photos with the beneficiary in a real implementation
  beneficiaryId: _beneficiaryId,
  isOpen,
  onOpenChange,
  initialPhotos = [],
  onPhotosChange,
}) => {
  // Photo management states
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  
  // Preview states
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);

  // Update local photos when initialPhotos change
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  // Update parent component when photos change
  useEffect(() => {
    if (onPhotosChange) {
      onPhotosChange(photos);
    }
  }, [photos, onPhotosChange]);

  /**
   * Handle photo upload event
   */
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files) return;

    setIsUploadingPhoto(true);
    setPhotoUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setPhotoUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploadingPhoto(false);

          // Add new photos
          const newPhotos = Array.from(files).map((file, index) => ({
            id: (photos.length) + index + 1,
            name: file.name,
            url: URL.createObjectURL(file),
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: new Date().toLocaleDateString('tr-TR'),
            type: file.type,
          }));

          // In a real implementation, you would upload to fileStorageService here
          // and set the returned URLs and file information
          setPhotos((prev) => [...prev, ...newPhotos]);
          toast.success(`${files.length} fotoğraf başarıyla yüklendi`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Clear the input to allow uploading the same file again
    event.target.value = '';
  };

  /**
   * Handle photo preview
   */
  const handlePhotoPreview = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsPhotoPreviewOpen(true);
  };

  /**
   * Handle photo deletion
   */
  const handlePhotoDelete = (photoId: number) => {
    // In a real implementation, you would call fileStorageService.deleteFile here
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    toast.success('Fotoğraf silindi');
  };

  /**
   * Handle photo download
   */
  const handlePhotoDownload = (photo: Photo) => {
    // In a real implementation, you would use fileStorageService.downloadFile or getFileUrl here
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fotoğraf indirildi');
  };

  /**
   * Handle closing the photo modal
   */
  const handleCloseModal = () => {
    onOpenChange(false);
  };

  return (
    <>
      {/* Photos Modal */}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Fotoğraf Galerisi
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Photo Upload Section */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fotoğraf Yükle</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fotoğrafları buraya sürükleyip bırakın veya seçmek için tıklayın
                </p>
                <div className="flex items-center justify-center gap-4">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Fotoğraf Seç
                  </label>
                </div>
                {isUploadingPhoto && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${photoUploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Yükleniyor... {photoUploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Photos Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Fotoğraflar ({photos.length})</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Grid className="w-4 h-4 mr-2" />
                    Izgara
                  </Button>
                </div>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz fotoğraf yüklenmemiş</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => {
                            handlePhotoPreview(photo);
                          }}
                        />
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                            onClick={() => {
                              handlePhotoDownload(photo);
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-600"
                            onClick={() => {
                              handlePhotoDelete(photo.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-medium truncate">{photo.name}</p>
                        <p className="text-xs text-gray-500">
                          {photo.size} • {photo.uploadDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseModal}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Modal */}
      <Dialog open={isPhotoPreviewOpen} onOpenChange={setIsPhotoPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{selectedPhoto?.name}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {selectedPhoto && (
              <div className="text-center">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.name}
                  className="max-w-full max-h-96 mx-auto rounded-lg"
                />
                <div className="mt-4 text-sm text-gray-500">
                  <p>
                    <strong>Boyut:</strong> {selectedPhoto.size}
                  </p>
                  <p>
                    <strong>Yüklenme tarihi:</strong> {selectedPhoto.uploadDate}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPhotoPreviewOpen(false);
              }}
            >
              Kapat
            </Button>
            <Button
              onClick={() => selectedPhoto && handlePhotoDownload(selectedPhoto)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BeneficiaryPhotoGallery;