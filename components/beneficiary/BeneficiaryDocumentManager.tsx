/**
 * @fileoverview BeneficiaryDocumentManager Component - Document management for beneficiaries
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { Download, Eye, FileIcon, Search, Trash2, Upload } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { BeneficiaryDocument } from '../../hooks/useBeneficiaryData';

interface BeneficiaryDocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: BeneficiaryDocument[];
  onDocumentsUpdate: (documents: BeneficiaryDocument[]) => void;
}

/**
 * Document management component for beneficiaries
 */
export function BeneficiaryDocumentManager({
  isOpen,
  onClose,
  documents,
  onDocumentsUpdate
}: BeneficiaryDocumentManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [previewFile, setPreviewFile] = useState<BeneficiaryDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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

          // Add new files to documents
          const newDocuments: BeneficiaryDocument[] = Array.from(files).map((file, index) => ({
            id: `${Date.now()}-${index}`,
            name: file.name,
            type: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'Resim' : 'Diğer',
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: new Date().toLocaleDateString('tr-TR'),
            url: URL.createObjectURL(file)
          }));

          onDocumentsUpdate([...documents, ...newDocuments]);
          toast.success(`${files.length} dosya başarıyla yüklendi`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Reset file input
    event.target.value = '';
  }, [documents, onDocumentsUpdate]);

  /**
   * Handle file deletion
   */
  const handleDeleteFile = useCallback((fileId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== fileId);
    onDocumentsUpdate(updatedDocuments);
    toast.success('Dosya başarıyla silindi');
  }, [documents, onDocumentsUpdate]);

  /**
   * Handle file download
   */
  const handleDownloadFile = useCallback((file: BeneficiaryDocument) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Dosya indiriliyor...');
    }
  }, []);

  /**
   * Handle file preview
   */
  const handlePreviewFile = useCallback((file: BeneficiaryDocument) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  /**
   * Filter documents based on search term and file type
   */
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedFileType === 'all' || doc.type === selectedFileType;
    return matchesSearch && matchesType;
  });

  /**
   * Get file type badge variant
   */
  const getFileTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'destructive';
      case 'resim':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <>
      {/* Document Management Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <FileIcon className="w-5 h-5" />
              Doküman Yönetimi
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col space-y-4 overflow-hidden">
            {/* Upload and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <label htmlFor="file-upload">
                  <Button asChild disabled={isUploading}>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Dosya Yükle
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

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Dosya ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
                <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Dosyalar</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Resim">Resim</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto max-h-[400px] border rounded-lg">
              {filteredDocuments.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <FileIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Henüz dosya yüklenmemiş</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredDocuments.map((file) => (
                    <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileIcon className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getFileTypeBadgeVariant(file.type)} className="text-xs">
                              {file.type}
                            </Badge>
                            <span className="text-xs text-gray-500">{file.size}</span>
                            <span className="text-xs text-gray-500">{file.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewFile(file)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

      {/* File Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
            {previewFile?.url ? (
              <div className="text-center p-4">
                <FileIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Dosya önizlemesi mevcut değil</p>
                <p className="text-sm text-gray-500 mt-2">
                  İndirme butonunu kullanarak dosyayı görüntüleyebilirsiniz
                </p>
              </div>
            ) : (
              <p className="text-gray-600">Dosya bulunamadı</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Kapat
            </Button>
            {previewFile && (
              <Button onClick={() => handleDownloadFile(previewFile)}>
                <Download className="w-4 h-4 mr-2" />
                İndir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BeneficiaryDocumentManager;