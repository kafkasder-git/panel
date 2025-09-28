/**
 * @fileoverview BeneficiaryDependentManager Component - Dependent person management for beneficiaries
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { Plus, Search, Trash2, Users } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { BeneficiaryDependent } from '../../hooks/useBeneficiaryData';

interface BeneficiaryDependentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  dependents: BeneficiaryDependent[];
  onDependentsUpdate: (dependents: BeneficiaryDependent[]) => void;
}

/**
 * Dependent person management component for beneficiaries
 */
export function BeneficiaryDependentManager({
  isOpen,
  onClose,
  dependents,
  onDependentsUpdate
}: BeneficiaryDependentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedDependent, setSelectedDependent] = useState<BeneficiaryDependent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    kimlik_no: '',
    birth_date: '',
    gender: '',
    address: ''
  });

  /**
   * Reset form data
   */
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      kimlik_no: '',
      birth_date: '',
      gender: '',
      address: ''
    });
    setSelectedDependent(null);
  }, []);

  /**
   * Handle form input changes
   */
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle creating new dependent
   */
  const handleCreateDependent = useCallback(() => {
    setModalMode('create');
    resetForm();
  }, [resetForm]);

  /**
   * Handle editing existing dependent
   */
  const handleEditDependent = useCallback((dependent: BeneficiaryDependent) => {
    setSelectedDependent(dependent);
    setFormData({
      name: dependent.name || '',
      relationship: dependent.relationship || '',
      phone: dependent.phone || '',
      kimlik_no: dependent.kimlik_no || '',
      birth_date: '',
      gender: '',
      address: ''
    });
    setModalMode('edit');
  }, []);

  /**
   * Handle saving dependent
   */
  const handleSaveDependent = useCallback(async () => {
    if (!formData.name.trim() || !formData.relationship.trim()) {
      toast.error('Ad/Soyad ve yakınlık derecesi zorunludur');
      return;
    }

    setIsSaving(true);

    try {
      if (modalMode === 'create') {
        // Create new dependent
        const newDependent: BeneficiaryDependent = {
          id: Date.now().toString(),
          name: formData.name,
          relationship: formData.relationship,
          phone: formData.phone,
          kimlik_no: formData.kimlik_no,
          ad_soyad: formData.name,
          yakinlik: formData.relationship,
          telefon_no: formData.phone,
          baglanti_tarihi: new Date().toLocaleDateString('tr-TR')
        };

        onDependentsUpdate([...dependents, newDependent]);
        toast.success('Bağlı kişi başarıyla eklendi');
      } else if (modalMode === 'edit' && selectedDependent) {
        // Update existing dependent
        const updatedDependents = dependents.map(dep =>
          dep.id === selectedDependent.id
            ? {
                ...dep,
                name: formData.name,
                relationship: formData.relationship,
                phone: formData.phone,
                kimlik_no: formData.kimlik_no,
                ad_soyad: formData.name,
                yakinlik: formData.relationship,
                telefon_no: formData.phone
              }
            : dep
        );

        onDependentsUpdate(updatedDependents);
        toast.success('Bağlı kişi başarıyla güncellendi');
      }

      setModalMode('list');
      resetForm();
    } catch (error) {
      toast.error('İşlem sırasında bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  }, [formData, modalMode, selectedDependent, dependents, onDependentsUpdate, resetForm]);

  /**
   * Handle deleting dependent
   */
  const handleDeleteDependent = useCallback((dependentId: string) => {
    const updatedDependents = dependents.filter(dep => dep.id !== dependentId);
    onDependentsUpdate(updatedDependents);
    toast.success('Bağlı kişi başarıyla silindi');
  }, [dependents, onDependentsUpdate]);

  /**
   * Handle closing modal
   */
  const handleCloseModal = useCallback(() => {
    setModalMode('list');
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  /**
   * Filter dependents based on search term
   */
  const filteredDependents = dependents.filter(dep =>
    dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.relationship.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dep.phone && dep.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  /**
   * Get relationship badge variant
   */
  const getRelationshipBadgeVariant = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'çocuk':
      case 'child':
        return 'default';
      case 'ebeveyn':
      case 'parent':
        return 'secondary';
      case 'eş':
      case 'spouse':
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
            <Users className="w-5 h-5" />
            Bağlı Kişiler Yönetimi
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
                    placeholder="Bağlı kişi ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[250px]"
                  />
                </div>
                <Button onClick={handleCreateDependent}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Bağlı Kişi Ekle
                </Button>
              </div>

              {/* Dependents List */}
              <div className="flex-1 overflow-y-auto max-h-[400px] border rounded-lg">
                {filteredDependents.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Henüz bağlı kişi eklenmemiş</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredDependents.map((dependent) => (
                      <div key={dependent.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{dependent.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getRelationshipBadgeVariant(dependent.relationship)} className="text-xs">
                                {dependent.relationship}
                              </Badge>
                              {dependent.phone && (
                                <span className="text-xs text-gray-500">{dependent.phone}</span>
                              )}
                              {dependent.baglanti_tarihi && (
                                <span className="text-xs text-gray-500">
                                  Bağlantı: {dependent.baglanti_tarihi}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDependent(dependent)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDependent(dependent.id)}
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
                    {modalMode === 'create' ? 'Yeni Bağlı Kişi Ekle' : 'Bağlı Kişi Düzenle'}
                  </h3>
                  <Button variant="outline" onClick={() => setModalMode('list')}>
                    Listeye Dön
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ad Soyad *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ad soyad girin"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Yakınlık Derecesi *</Label>
                    <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Yakınlık derecesi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="çocuk">Çocuk</SelectItem>
                        <SelectItem value="eş">Eş</SelectItem>
                        <SelectItem value="ebeveyn">Ebeveyn</SelectItem>
                        <SelectItem value="kardeş">Kardeş</SelectItem>
                        <SelectItem value="büyükanne/büyükbaba">Büyükanne/Büyükbaba</SelectItem>
                        <SelectItem value="torun">Torun</SelectItem>
                        <SelectItem value="diğer">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Telefon numarası"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kimlik No</Label>
                    <Input
                      value={formData.kimlik_no}
                      onChange={(e) => handleInputChange('kimlik_no', e.target.value)}
                      placeholder="TC Kimlik numarası"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCloseModal}>
            {modalMode === 'list' ? 'Kapat' : 'İptal'}
          </Button>
          {modalMode !== 'list' && (
            <Button onClick={handleSaveDependent} disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : modalMode === 'create' ? 'Ekle' : 'Güncelle'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BeneficiaryDependentManager;