/**
 * @fileoverview BeneficiaryRelationshipManager Component - Relationship management for beneficiaries
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Info, 
  Plus, 
  Search, 
  Trash, 
  Users,
  Link2 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ihtiyacSahipleriService } from '../../services';

export interface Relationship {
  id: string | number;
  type: string;
  person_id?: string | number;
  person?: {
    id: string | number;
    ad_soyad?: string;
    name?: string;
    surname?: string;
    id_number?: string;
    phone?: string;
  };
  notes?: string;
  status?: 'active' | 'inactive';
  [key: string]: any; // For any other properties
}

export interface BeneficiaryRelationshipManagerProps {
  /** The beneficiary ID to manage relationships for */
  beneficiaryId: string | number;
  /** Whether the relationship manager modal is open */
  isOpen: boolean;
  /** Callback when the modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Initial relationships (if any) */
  initialRelationships?: Relationship[];
  /** Callback when relationships are updated */
  onRelationshipsChange?: (relationships: Relationship[]) => void;
}

/**
 * BeneficiaryRelationshipManager Component
 * 
 * Handles relationship management for beneficiaries including creating and 
 * managing connections to other people in the system.
 */
export const BeneficiaryRelationshipManager: React.FC<BeneficiaryRelationshipManagerProps> = ({
  beneficiaryId,
  isOpen,
  onOpenChange,
  initialRelationships = [],
  onRelationshipsChange,
}) => {
  // State for relationships
  const [relationships, setRelationships] = useState<Relationship[]>(initialRelationships);
  
  // State for new relationship
  const [newRelationship, setNewRelationship] = useState({
    personId: '',
    type: '',
    notes: '',
  });
  
  // State for available persons
  const [availablePersons, setAvailablePersons] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update relationships when initialRelationships change
  useEffect(() => {
    setRelationships(initialRelationships);
  }, [initialRelationships]);

  // Notify parent component when relationships change
  useEffect(() => {
    if (onRelationshipsChange) {
      onRelationshipsChange(relationships);
    }
  }, [relationships, onRelationshipsChange]);

  /**
   * Load available persons from the database
   */
  const loadAvailablePersons = async () => {
    if (!beneficiaryId) return;
    
    setIsLoading(true);
    try {
      // Call the service to get all potential related persons
      const result = await ihtiyacSahipleriService.getIhtiyacSahipleri(
        1, // page
        500, // pageSize - get more records
        {}, // No type filter - get all persons
      );

      if (result.data) {
        // Filter out the current beneficiary
        const filteredPersons = result.data.filter(
          (person: any) => String(person.id) !== String(beneficiaryId)
        );
        setAvailablePersons(filteredPersons);
      } else if (result.error) {
        console.error('❌ Error loading persons:', result.error);
        toast.error(`Kişiler yüklenirken hata: ${result.error}`);
      }
    } catch (error: any) {
      console.error('❌ Unexpected error loading persons:', error);
      toast.error('Kişiler yüklenirken beklenmeyen hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle opening the modal
   */
  const handleOpenModal = async () => {
    loadAvailablePersons();
  };

  /**
   * Handle adding a new relationship
   */
  const handleAddRelationship = async () => {
    if (!newRelationship.personId) {
      toast.error('Lütfen ilişki kurulacak kişiyi seçiniz');
      return;
    }

    if (!newRelationship.type) {
      toast.error('Lütfen ilişki tipini seçiniz');
      return;
    }

    setIsSaving(true);
    try {
      const selectedPerson = availablePersons.find(
        (p) => String(p.id) === String(newRelationship.personId)
      );

      if (!selectedPerson) {
        toast.error('Seçilen kişi bulunamadı');
        return;
      }

      // Check if relationship already exists
      const alreadyExists = relationships.some(
        (rel) => String(rel.person_id) === String(newRelationship.personId)
      );

      if (alreadyExists) {
        toast.error('Bu kişi ile ilişki zaten mevcut');
        return;
      }

      // Create new relationship object
      const relationship: Relationship = {
        id: `rel-${Date.now()}`,
        type: newRelationship.type,
        person_id: newRelationship.personId,
        person: selectedPerson,
        notes: newRelationship.notes,
        status: 'active',
      };

      // In a real implementation, you would save to database here
      // For now, just update the local state
      setRelationships((prev) => [...prev, relationship]);
      
      toast.success('İlişki başarıyla eklendi');
      
      // Reset form
      setNewRelationship({
        personId: '',
        type: '',
        notes: '',
      });
      
    } catch (error: any) {
      console.error('❌ Error adding relationship:', error);
      toast.error('İlişki eklenirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle removing a relationship
   */
  const handleRemoveRelationship = (relationshipId: string | number) => {
    try {
      // In a real implementation, you would delete from database here
      setRelationships((prev) => prev.filter((rel) => rel.id !== relationshipId));
      toast.success('İlişki kaldırıldı');
    } catch (error: any) {
      console.error('❌ Error removing relationship:', error);
      toast.error('İlişki kaldırılırken hata oluştu');
    }
  };

  /**
   * Filter available persons based on search term
   */
  const filteredPersons = availablePersons.filter((person) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      person.ad_soyad?.toLowerCase().includes(searchLower) ||
      person.id_number?.toLowerCase().includes(searchLower) ||
      person.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Call handleOpenModal when the modal is opened
  useEffect(() => {
    if (isOpen) {
      handleOpenModal();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            İlişki Yönetimi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <div className="text-sm text-gray-600">Bu kişinin ilişkileri</div>

            {/* Current relationships */}
            {relationships.length > 0 ? (
              <div className="space-y-2">
                {relationships.map((relationship) => (
                  <div 
                    key={relationship.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        {relationship.person?.ad_soyad || 'İsimsiz Kişi'}
                      </div>
                      <div className="text-sm text-gray-600 flex flex-wrap gap-x-4">
                        <span>
                          <span className="font-medium">İlişki:</span>{' '}
                          {relationship.type}
                        </span>
                        {relationship.notes && (
                          <span>
                            <span className="font-medium">Not:</span>{' '}
                            {relationship.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveRelationship(relationship.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Henüz ilişki tanımlanmamış</p>
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <div className="font-medium mb-2">Yeni İlişki Ekle</div>
              
              <div className="space-y-3">
                {/* Person selection */}
                <div className="space-y-2">
                  <Label htmlFor="search-person">Kişi Ara</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="search-person"
                      placeholder="Ad, soyad veya TC ile arama yapın..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Person list */}
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium text-gray-700">
                    Kişiler ({filteredPersons.length})
                  </div>
                  <div className="divide-y max-h-40 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" />
                        <p className="mt-2">Kişiler yükleniyor...</p>
                      </div>
                    ) : filteredPersons.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {searchTerm ? (
                          <>Arama kriterine uygun kişi bulunamadı.</>
                        ) : (
                          <>Kişi bulunamadı.</>
                        )}
                      </div>
                    ) : (
                      filteredPersons.map((person) => {
                        const isAlreadyRelated = relationships.some(
                          (rel) => String(rel.person_id) === String(person.id)
                        );
                        
                        return (
                          <div
                            key={person.id}
                            className={`p-3 hover:bg-gray-50 ${
                              newRelationship.personId === String(person.id) ? 'bg-blue-50' : ''
                            } ${isAlreadyRelated ? 'opacity-50' : ''}`}
                          >
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  {person.ad_soyad}
                                  {isAlreadyRelated && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                                      <Check className="w-3 h-3 mr-1" />
                                      İlişki mevcut
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">TC:</span> {person.id_number || 'Belirtilmemiş'}
                                  {person.phone && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span className="font-medium">Tel:</span> {person.phone}
                                    </>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 ${
                                  isAlreadyRelated
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : newRelationship.personId === String(person.id)
                                    ? 'text-blue-600'
                                    : 'text-gray-600'
                                }`}
                                onClick={() => {
                                  if (!isAlreadyRelated) {
                                    setNewRelationship({
                                      ...newRelationship,
                                      personId: 
                                        newRelationship.personId === String(person.id) ? '' : String(person.id)
                                    });
                                  }
                                }}
                                disabled={isAlreadyRelated}
                              >
                                {newRelationship.personId === String(person.id) ? (
                                  <Check className="w-5 h-5" />
                                ) : (
                                  <Plus className="w-5 h-5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Relationship type */}
                <div className="space-y-2">
                  <Label htmlFor="relationship-type">İlişki Tipi *</Label>
                  <Select
                    value={newRelationship.type}
                    onValueChange={(value) => 
                      setNewRelationship({ ...newRelationship, type: value })
                    }
                  >
                    <SelectTrigger id="relationship-type">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Akraba">Akraba</SelectItem>
                      <SelectItem value="Arkadaş">Arkadaş</SelectItem>
                      <SelectItem value="Komşu">Komşu</SelectItem>
                      <SelectItem value="İş Arkadaşı">İş Arkadaşı</SelectItem>
                      <SelectItem value="Aynı Mahalle">Aynı Mahalle</SelectItem>
                      <SelectItem value="Referans">Referans</SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notlar</Label>
                  <Input
                    id="notes"
                    placeholder="İlişki hakkında not ekleyebilirsiniz"
                    value={newRelationship.notes}
                    onChange={(e) => 
                      setNewRelationship({ ...newRelationship, notes: e.target.value })
                    }
                  />
                </div>

                {newRelationship.personId && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="flex gap-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-800">
                          Bu işlem, seçilen kişi ile bir ilişki oluşturacaktır. İlişkiler 
                          raporlama ve analiz işlemlerinde kullanılabilir.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          
          <Button
            onClick={handleAddRelationship}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!newRelationship.personId || !newRelationship.type || isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                İşlem Yapılıyor...
              </>
            ) : (
              'İlişki Ekle'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BeneficiaryRelationshipManager;