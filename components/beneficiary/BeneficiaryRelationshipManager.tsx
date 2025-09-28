/**
 * @fileoverview BeneficiaryRelationshipManager Component - Relationship management for beneficiaries
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { Heart, Plus, Search, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { BeneficiaryRelationship } from '../../hooks/useBeneficiaryData';

interface BeneficiaryRelationshipManagerProps {
  isOpen: boolean;
  onClose: () => void;
  relationships: BeneficiaryRelationship[];
  onRelationshipsUpdate: (relationships: BeneficiaryRelationship[]) => void;
}

/**
 * Relationship management component for beneficiaries
 */
export function BeneficiaryRelationshipManager({
  isOpen,
  onClose,
  relationships,
  onRelationshipsUpdate
}: BeneficiaryRelationshipManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedRelationship, setSelectedRelationship] = useState<BeneficiaryRelationship | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  /**
   * Reset form data
   */
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      type: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'active'
    });
    setSelectedRelationship(null);
  }, []);

  /**
   * Handle form input changes
   */
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle creating new relationship
   */
  const handleCreateRelationship = useCallback(() => {
    setModalMode('create');
    resetForm();
  }, [resetForm]);

  /**
   * Handle editing existing relationship
   */
  const handleEditRelationship = useCallback((relationship: BeneficiaryRelationship) => {
    setSelectedRelationship(relationship);
    setFormData({
      name: relationship.name || '',
      type: relationship.type || '',
      description: relationship.description || '',
      startDate: relationship.startDate || '',
      endDate: relationship.endDate || '',
      status: relationship.status || 'active'
    });
    setModalMode('edit');
  }, []);

  /**
   * Handle saving relationship
   */
  const handleSaveRelationship = useCallback(async () => {
    if (!formData.name.trim() || !formData.type.trim()) {
      toast.error('İsim ve tür alanları zorunludur');
      return;
    }

    setIsSaving(true);

    try {
      if (modalMode === 'create') {
        // Create new relationship
        const newRelationship: BeneficiaryRelationship = {
          id: Date.now().toString(),
          name: formData.name,
          type: formData.type,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status
        };

        onRelationshipsUpdate([...relationships, newRelationship]);
        toast.success('İlişki başarıyla eklendi');
      } else if (modalMode === 'edit' && selectedRelationship) {
        // Update existing relationship
        const updatedRelationships = relationships.map(rel =>
          rel.id === selectedRelationship.id
            ? {
                ...rel,
                name: formData.name,
                type: formData.type,
                description: formData.description,
                startDate: formData.startDate,
                endDate: formData.endDate,
                status: formData.status
              }
            : rel
        );

        onRelationshipsUpdate(updatedRelationships);
        toast.success('İlişki başarıyla güncellendi');
      }

      setModalMode('list');
      resetForm();
    } catch (error) {
      toast.error('İşlem sırasında bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  }, [formData, modalMode, selectedRelationship, relationships, onRelationshipsUpdate, resetForm]);

  /**
   * Handle deleting relationship
   */
  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    const updatedRelationships = relationships.filter(rel => rel.id !== relationshipId);
    onRelationshipsUpdate(updatedRelationships);
    toast.success('İlişki başarıyla silindi');
  }, [relationships, onRelationshipsUpdate]);

  /**
   * Handle closing modal
   */
  const handleCloseModal = useCallback(() => {
    setModalMode('list');
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  /**
   * Filter relationships based on search term
   */
  const filteredRelationships = relationships.filter(rel =>
    rel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rel.description && rel.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  /**
   * Get status badge variant
   */
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'aktif':
        return 'default';
      case 'inactive':
      case 'pasif':
        return 'secondary';
      case 'ended':
      case 'sona erdi':
        return 'outline';
      default:
        return 'outline';
    }
  };

  /**
   * Get type badge variant
   */
  const getTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'aile':
      case 'family':
        return 'default';
      case 'iş':
      case 'work':
        return 'secondary';
      case 'arkadaş':
      case 'friend':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5" />
            İlişkiler Yönetimi
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 overflow-hidden">
          {modalMode === 'list' ? (
            <>
              {/* List View Controls */}
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="İlişki ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[250px]"
                  />
                </div>
                <Button onClick={handleCreateRelationship}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni İlişki Ekle
                </Button>
              </div>

              {/* Relationships List */}
              <div className="flex-1 overflow-y-auto max-h-[400px] border rounded-lg">
                {filteredRelationships.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <div className="text-center">
                      <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Henüz ilişki eklenmemiş</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredRelationships.map((relationship) => (
                      <div key={relationship.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                            <Heart className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{relationship.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getTypeBadgeVariant(relationship.type)} className="text-xs">
                                {relationship.type}
                              </Badge>
                              <Badge variant={getStatusBadgeVariant(relationship.status)} className="text-xs">
                                {relationship.status === 'active' ? 'Aktif' : relationship.status === 'inactive' ? 'Pasif' : 'Sona Erdi'}
                              </Badge>
                              {relationship.startDate && (
                                <span className="text-xs text-gray-500">
                                  Başlangıç: {relationship.startDate}
                                </span>
                              )}
                            </div>
                            {relationship.description && (
                              <p className="text-sm text-gray-600 mt-1">{relationship.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRelationship(relationship)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRelationship(relationship.id)}
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
            </>
          ) : (
            <>
              {/* Form View */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {modalMode === 'create' ? 'Yeni İlişki Ekle' : 'İlişki Düzenle'}
                  </h3>
                  <Button variant="outline" onClick={() => setModalMode('list')}>
                    Listeye Dön
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İsim *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Kişi veya kurum adı"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tür *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="İlişki türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aile">Aile</SelectItem>
                        <SelectItem value="arkadaş">Arkadaş</SelectItem>
                        <SelectItem value="iş">İş</SelectItem>
                        <SelectItem value="komşu">Komşu</SelectItem>
                        <SelectItem value="kurum">Kurum</SelectItem>
                        <SelectItem value="diğer">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Pasif</SelectItem>
                        <SelectItem value="ended">Sona Erdi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="İlişki hakkında açıklama"
                    rows={3}
                  />
                </div>

                {formData.status === 'ended' && (
                  <div className="space-y-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCloseModal}>
            {modalMode === 'list' ? 'Kapat' : 'İptal'}
          </Button>
          {modalMode !== 'list' && (
            <Button onClick={handleSaveRelationship} disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : modalMode === 'create' ? 'Ekle' : 'Güncelle'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BeneficiaryRelationshipManager;