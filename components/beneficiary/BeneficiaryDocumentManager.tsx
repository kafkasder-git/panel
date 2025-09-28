/**
 * @fileoverview BeneficiaryDocumentManager Component - Document management for beneficiaries
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  File,
  FileText as FileIcon,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Search,
  Filter,
  Upload,
  Eye,
  Trash,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// fileStorageService removed as it's not actively used

export interface DocumentFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  url: string;
}

export interface BeneficiaryDocumentManagerProps {
  /** The beneficiary ID to associate documents with */
  beneficiaryId: string;
  /** Whether the document manager modal is open */
  isOpen: boolean;
  /** Callback when the modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Initial files to display (if any) */
  initialFiles?: DocumentFile[];
  /** Callback when files are updated (uploaded/deleted) */
  onFilesChange?: (files: DocumentFile[]) => void;
}

/**
 * BeneficiaryDocumentManager Component
 * 
 * Handles document management for beneficiaries including upload, preview,
 * download, filtering, and deletion of document files.
 */
export const BeneficiaryDocumentManager: React.FC<BeneficiaryDocumentManagerProps> = ({
  beneficiaryId,
  isOpen,
  onOpenChange,
  initialFiles = [],
  onFilesChange,
}) => {
  // File management states
  const [uploadedFiles, setUploadedFiles] = useState<DocumentFile[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Preview states
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Update local files when initialFiles change
  useEffect(() => {
    setUploadedFiles(initialFiles);
  }, [initialFiles]);

  // Update parent component when files change
  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(uploadedFiles);
    }
  }, [uploadedFiles, onFilesChange]);

  /**
   * Handle file upload event
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          // Add uploaded files to the list
          const newFiles = Array.from(files).map((file, index) => ({
            id: `${beneficiaryId}-${Date.now()}-${index}`,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.type,
            uploadDate: new Date().toISOString().split('T')[0],
            url: URL.createObjectURL(file),
          }));

          // In a real implementation, you would upload to fileStorageService here
          // and set the returned URLs and file information
          setUploadedFiles((prev) => [...prev, ...newFiles]);
          toast.success(`${files.length} dosya başarıyla yüklendi`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Clear the input to allow uploading the same file again
    event.target.value = '';
  };

  /**
   * Handle file deletion
   */
  const handleDeleteFile = (fileId: string) => {
    // In a real implementation, you would call fileStorageService.deleteFile here
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    toast.success('Dosya başarıyla silindi');
  };

  /**
   * Handle file preview
   */
  const handlePreviewFile = (file: DocumentFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  /**
   * Handle file download
   */
  const handleDownloadFile = (file: DocumentFile) => {
    // In a real implementation, you would use fileStorageService.downloadFile or getFileUrl here
    // For now we just simulate the download with a toast
    toast.success(`${file.name} indiriliyor...`);
    
    // If the file has a URL, we can create a temporary download link
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * Get appropriate icon for file type
   */
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (fileType.includes('pdf')) return <FileIcon className="w-4 h-4" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel'))
      return <FileSpreadsheet className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  /**
   * Filter files based on search term and file type
   */
  const filteredFiles = uploadedFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedFileType === 'all' ||
      (selectedFileType === 'image' && file.type.startsWith('image/')) ||
      (selectedFileType === 'pdf' && file.type.includes('pdf')) ||
      (selectedFileType === 'document' &&
        !file.type.startsWith('image/') &&
        !file.type.includes('pdf'));
    return matchesSearch && matchesType;
  });

  /**
   * Handle closing the document modal
   */
  const handleCloseModal = () => {
    onOpenChange(false);
  };

  return (
    <>
      {/* Document Management Modal */}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <FileIcon className="w-5 h-5" />
              Doküman Yönetimi
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Dosya Yükle</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Dosyaları buraya sürükleyip bırakın veya seçmek için tıklayın
                </p>
                <div className="flex items-center justify-center gap-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Dosya Seç
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Desteklenen formatlar: PDF, DOC, DOCX, JPG, PNG, XLSX (Maks. 10MB)
                </p>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Yükleniyor...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Dosya ara..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Dosyalar</SelectItem>
                  <SelectItem value="image">Resimler</SelectItem>
                  <SelectItem value="pdf">PDF Dosyalar</SelectItem>
                  <SelectItem value="document">Diğer Dokümanlar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Files List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Henüz dosya yüklenmemiş</p>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.size} • {file.uploadDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handlePreviewFile(file);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleDownloadFile(file);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleDeleteFile(file.id);
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* File Statistics */}
            <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
              <span>Toplam {uploadedFiles.length} dosya</span>
              <span>
                Toplam boyut:{' '}
                {uploadedFiles
                  .reduce((total, file) => {
                    const size = parseFloat(file.size.replace(' MB', ''));
                    return total + size;
                  }, 0)
                  .toFixed(1)}{' '}
                MB
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="px-6">
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{previewFile?.name}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {previewFile?.type.startsWith('image/') ? (
              <div className="text-center">
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-96 mx-auto rounded-lg"
                />
              </div>
            ) : previewFile?.type.includes('pdf') ? (
              <div className="text-center py-8">
                <FileIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">PDF önizlemesi mevcut değil</p>
                <p className="text-sm text-gray-500 mt-2">Dosyayı görüntülemek için indirin</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Bu dosya türü için önizleme mevcut değil</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>
                    <strong>Dosya adı:</strong> {previewFile?.name}
                  </p>
                  <p>
                    <strong>Boyut:</strong> {previewFile?.size}
                  </p>
                  <p>
                    <strong>Yüklenme tarihi:</strong> {previewFile?.uploadDate}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPreviewOpen(false);
              }}
            >
              Kapat
            </Button>
            <Button
              onClick={() => {
                if (previewFile) handleDownloadFile(previewFile);
              }}
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

export default BeneficiaryDocumentManager;