/**
 * @fileoverview BeneficiaryPhotoGallery Component - Photo management for beneficiaries
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { Camera, Eye, Trash2, Upload, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import type { BeneficiaryPhoto } from '../../hooks/useBeneficiaryData';

interface BeneficiaryPhotoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  photos: BeneficiaryPhoto[];
  onPhotosUpdate: (photos: BeneficiaryPhoto[]) => void;
}

/**
 * Photo gallery component for beneficiaries
 */
export function BeneficiaryPhotoGallery({
  isOpen,
  onClose,
  photos,
  onPhotosUpdate
}: BeneficiaryPhotoGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<BeneficiaryPhoto | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /**
   * Handle photo upload
   */
  const handlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          // Add new photos
          const newPhotos: BeneficiaryPhoto[] = Array.from(files).map((file, index) => ({
            id: Date.now() + index,
            name: file.name,
            url: URL.createObjectURL(file),
            uploadDate: new Date().toLocaleDateString('tr-TR'),
            description: `Uploaded ${file.name}`
          }));

          onPhotosUpdate([...photos, ...newPhotos]);
          toast.success(`${files.length} fotoğraf başarıyla yüklendi`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Reset file input
    event.target.value = '';
  }, [photos, onPhotosUpdate]);

  /**
   * Handle photo deletion
   */
  const handleDeletePhoto = useCallback((photoId: number) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosUpdate(updatedPhotos);
    toast.success('Fotoğraf başarıyla silindi');
  }, [photos, onPhotosUpdate]);

  /**
   * Handle photo preview
   */
  const handlePreviewPhoto = useCallback((photo: BeneficiaryPhoto) => {
    setSelectedPhoto(photo);
    setIsPreviewOpen(true);
  }, []);

  return (
    <>
      {/* Photos Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Fotoğraf Galerisi
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col space-y-4 overflow-hidden">
            {/* Upload Controls */}
            <div className="flex items-center gap-4">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button asChild disabled={isUploading}>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Fotoğraf Yükle
                  </span>
                </Button>
              </label>

              {isUploading && (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Progress value={uploadProgress} className="flex-1" />
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
              )}
            </div>

            {/* Photos Grid */}
            <div className="flex-1 overflow-y-auto max-h-[400px]">
              {photos.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Henüz fotoğraf yüklenmemiş</p>
                    <p className="text-sm mt-1">Fotoğraf eklemek için "Fotoğraf Yükle" butonunu kullanın</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-square">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Im0xNSAxMi03IDUtNy01IDctNXoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+';
                          }}
                        />
                      </div>
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePreviewPhoto(photo)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Photo info */}
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate">{photo.name}</p>
                        {photo.uploadDate && (
                          <p className="text-xs text-gray-500">{photo.uploadDate}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center justify-between">
              <span>{selectedPhoto?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-center max-h-[500px] overflow-hidden rounded-lg bg-gray-100">
            {selectedPhoto ? (
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Im0xNSAxMi03IDUtNy01IDctNXoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+';
                }}
              />
            ) : (
              <p className="text-gray-600">Fotoğraf bulunamadı</p>
            )}
          </div>

          {selectedPhoto?.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{selectedPhoto.description}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Kapat
            </Button>
            {selectedPhoto && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeletePhoto(selectedPhoto.id);
                  setIsPreviewOpen(false);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sil
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BeneficiaryPhotoGallery;