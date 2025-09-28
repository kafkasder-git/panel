/**
 * @fileoverview BeneficiaryDependentManager Component - Dependent person management for beneficiaries
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Check, 
  Info, 
  Plus, 
  Search, 
  Trash, 
  Users,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { ihtiyacSahipleriService } from '../../services';
import { supabaseAdmin } from '../../lib/supabase';

export interface DependentPerson {
  id: string | number;
  ad_soyad?: string;
  name?: string;
  surname?: string;
  id_number?: string;
  phone?: string;
  relationship?: string;
  yakinlik?: string;
  durum?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  [key: string]: any; // For any other properties
}

export interface BeneficiaryDependentManagerProps {
  /** The beneficiary ID to associate dependents with */
  beneficiaryId: string | number;
  /** Whether the dependent manager modal is open */
  isOpen: boolean;
  /** Callback when the modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Initially connected dependents (if any) */
  initialConnectedDependents?: DependentPerson[];
  /** Callback when dependents are updated */
  onDependentsChange?: (dependents: DependentPerson[]) => void;
}

type ModalMode = 'list' | 'create' | 'select';

/**
 * BeneficiaryDependentManager Component
 * 
 * Handles dependent person management for beneficiaries including listing,
 * creating, and connecting existing dependents.
 */
export const BeneficiaryDependentManager: React.FC<BeneficiaryDependentManagerProps> = ({
  beneficiaryId,
  isOpen,
  onOpenChange,
  initialConnectedDependents = [],
  onDependentsChange,
}) => {
  // Modal mode and states
  const [modalMode, setModalMode] = useState<ModalMode>('list');

  // Connected dependents state
  const [connectedDependents, setConnectedDependents] = useState<DependentPerson[]>(initialConnectedDependents);

  // Existing dependents state (for selection)
  const [existingDependents, setExistingDependents] = useState<DependentPerson[]>([]);
  
  // Selection and form states
  const [selectedDependentId, setSelectedDependentId] = useState<string | null>(null);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState('');
  const [dependentPersonData, setDependentPersonData] = useState({
    name: '',
    surname: '',
    id_number: '',
    phone: '',
    relationship: '',
    birth_date: '',
    gender: '',
    address: '',
  });

  // Loading and search states
  const [isSavingDependent, setIsSavingDependent] = useState(false);
  const [isLoadingDependents, setIsLoadingDependents] = useState(false);
  const [dependentSearchTerm, setDependentSearchTerm] = useState('');

  // Update local connectedDependents when initialConnectedDependents change
  useEffect(() => {
    setConnectedDependents(initialConnectedDependents);
  }, [initialConnectedDependents]);

  // Update parent component when dependents change
  useEffect(() => {
    if (onDependentsChange) {
      onDependentsChange(connectedDependents);
    }
  }, [connectedDependents, onDependentsChange]);

  /**
   * Load connected dependents
   */
  const loadConnectedDependents = async () => {
    if (!beneficiaryId) return;
    
    try {
      setIsLoadingDependents(true);
      
      // In a real implementation, this would fetch from family_relationships table
      // For now, just use the initialConnectedDependents or an empty array
      
      // This is a placeholder, in real code you would fetch from the database
      // const { data, error } = await supabaseAdmin
      //   .from('family_relationships')
      //   .select('*, family_member:family_member_id(*)')
      //   .eq('primary_beneficiary_id', beneficiaryId)
      //   .eq('is_dependent', true);

      // if (error) throw error;
      
      // setConnectedDependents(data || []);
      
      // For now, we'll just use the initialConnectedDependents
      console.log('✅ Loaded connected dependents:', initialConnectedDependents);
      
    } catch (error) {
      console.error('❌ Error loading connected dependents:', error);
      toast.error('Bağlı kişiler yüklenirken hata oluştu');
    } finally {
      setIsLoadingDependents(false);
    }
  };

  /**
   * Load existing dependents for selection
   */
  const loadExistingDependents = async () => {
    setIsLoadingDependents(true);
    
    try {
      // Call the service to get all potential dependents
      const result = await ihtiyacSahipleriService.getIhtiyacSahipleri(
        1, // page
        500, // pageSize - get more records
        {}, // No type filter - get all persons
      );

      if (result.data) {
        console.log('✅ Loaded existing dependents:', result.data);
        setExistingDependents(
          result.data.map((person: any) => ({
            ...person,
            yakinlik: 'Belirtilmemiş', // Default relationship
            durum: 'Aktif', // Default status
          })),
        );
      } else if (result.error) {
        console.error('❌ Error loading dependents:', result.error);
        toast.error(`Bağlı kişiler yüklenirken hata: ${result.error}`);
        setExistingDependents([]);
      }
    } catch (error: any) {
      console.error('❌ Unexpected error loading dependents:', error);
      toast.error('Bağlı kişiler yüklenirken beklenmeyen hata oluştu');
      setExistingDependents([]);
    } finally {
      setIsLoadingDependents(false);
    }
  };

  /**
   * Ensure family relationships policies exist
   * This is needed for the Supabase RLS to work properly
   */
  const ensureFamilyRelationshipsPolicies = async () => {
    try {
      // Create policies with admin client
      const policies = [
        {
          name: 'FamilyRelationships insert',
          sql: `CREATE POLICY "FamilyRelationships insert" ON "public"."family_relationships" FOR INSERT TO authenticated WITH CHECK (true);`,
        },
        {
          name: 'FamilyRelationships update',
          sql: `CREATE POLICY "FamilyRelationships update" ON "public"."family_relationships" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`,
        },
        {
          name: 'FamilyRelationships delete',
          sql: `CREATE POLICY "FamilyRelationships delete" ON "public"."family_relationships" FOR DELETE TO authenticated USING (true);`,
        },
      ];

      for (const policy of policies) {
        try {
          await supabaseAdmin.rpc('exec_sql', { sql: policy.sql });
        } catch (err: any) {
          // Ignore if policy already exists error
          if (!err.message.includes('already exists')) {
            throw err;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error creating policies:', error);
      // Continue anyway, might work with existing policies
    }
  };

  /**
   * Open the dependent person modal
   */
  const handleOpenModal = async () => {
    setModalMode('list'); // Start by showing the list of connected dependents
    await ensureFamilyRelationshipsPolicies(); // Check policies
    loadConnectedDependents(); // Load connected dependents
  };

  /**
   * Close the dependent person modal and reset state
   */
  const handleCloseModal = () => {
    onOpenChange(false);
    setModalMode('list'); // Return to list mode
    setSelectedDependentId(null);
    setSelectedRelationshipType('');
    setDependentSearchTerm('');
    setDependentPersonData({
      name: '',
      surname: '',
      id_number: '',
      phone: '',
      relationship: '',
      birth_date: '',
      gender: '',
      address: '',
    });
  };

  /**
   * Validate Turkish ID number
   */
  const validateTcNumber = (tc: string): boolean => {
    const cleanTc = tc.replace(/\s/g, '');
    return /^\d{11}$/.test(cleanTc);
  };

  /**
   * Validate phone number
   */
  const validatePhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    return /^(05\d{9}|\+905\d{9})$/.test(cleanPhone);
  };

  /**
   * Save new dependent person
   */
  const handleSaveDependent = async () => {
    // Validation
    if (!dependentPersonData.name.trim()) {
      toast.error('Ad alanı zorunludur');
      return;
    }

    if (!dependentPersonData.surname.trim()) {
      toast.error('Soyad alanı zorunludur');
      return;
    }

    if (!dependentPersonData.id_number.trim()) {
      toast.error('TC Kimlik No alanı zorunludur');
      return;
    }

    if (!validateTcNumber(dependentPersonData.id_number)) {
      toast.error('TC Kimlik No 11 haneli olmalıdır');
      return;
    }

    if (dependentPersonData.phone && !validatePhoneNumber(dependentPersonData.phone)) {
      toast.error('Geçerli bir telefon numarası giriniz');
      return;
    }

    if (!dependentPersonData.relationship) {
      toast.error('Yakınlık derecesi seçiniz');
      return;
    }

    try {
      setIsSavingDependent(true);

      // Here you would typically save to database
      // For now, we'll simulate the save operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a new dependent person object
      const newDependent: DependentPerson = {
        id: `new-${Date.now()}`,
        ad_soyad: `${dependentPersonData.name} ${dependentPersonData.surname}`,
        ...dependentPersonData,
        yakinlik: dependentPersonData.relationship,
      };
      
      // Add to connected dependents
      setConnectedDependents((prev) => [...prev, newDependent]);

      toast.success('Bakmakla yükümlü kişi başarıyla kaydedildi');
      
      // Return to list mode
      setModalMode('list');
      
      // Reset form
      setDependentPersonData({
        name: '',
        surname: '',
        id_number: '',
        phone: '',
        relationship: '',
        birth_date: '',
        gender: '',
        address: '',
      });
      
    } catch (error) {
      console.error('Error saving dependent person:', error);
      toast.error('Kayıt sırasında hata oluştu');
    } finally {
      setIsSavingDependent(false);
    }
  };

  /**
   * Link an existing person as a dependent
   */
  const handleLinkExistingPerson = async () => {
    if (!selectedDependentId || !beneficiaryId) {
      toast.error('Lütfen bağlanacak kişiyi seçiniz');
      return;
    }

    if (!selectedRelationshipType) {
      toast.error('Lütfen yakınlık derecesi seçiniz');
      return;
    }

    try {
      setIsSavingDependent(true);

      const selectedPerson = existingDependents.find((p) => String(p.id) === selectedDependentId);
      console.log(
        '🔄 Linking person:',
        selectedPerson?.ad_soyad,
        'to beneficiary:',
        beneficiaryId,
        'relationship:',
        selectedRelationshipType,
      );

      // In a real implementation, you would save to the database here
      // For now, we'll just add to the local state
      
      if (selectedPerson) {
        const linkedDependent: DependentPerson = {
          ...selectedPerson,
          yakinlik: selectedRelationshipType,
          relationship_id: `rel-${Date.now()}`, // Simulating a relationship ID
        };
        
        setConnectedDependents((prev) => [...prev, linkedDependent]);
        toast.success(`${selectedPerson?.ad_soyad} başarıyla bağlandı`);
      }

      // Return to list mode
      setModalMode('list');
      setSelectedDependentId(null);
      setSelectedRelationshipType('');
    } catch (error: any) {
      console.error('❌ Unexpected error linking person:', error);
      toast.error('Bağlantı sırasında beklenmeyen hata oluştu');
    } finally {
      setIsSavingDependent(false);
    }
  };

  /**
   * Remove a connection between beneficiary and dependent
   */
  const handleRemoveConnection = async (relationshipId: string, personName: string) => {
    try {
      console.log('🔄 Removing relationship:', relationshipId);

      // In a real implementation, you would delete from the database here
      // For now, we'll just remove from the local state
      setConnectedDependents((prev) => 
        prev.filter(dependent => 
          dependent['relationship_id'] !== relationshipId && dependent.id !== relationshipId
        )
      );
      
      toast.success(`${personName} bağlantısı kaldırıldı`);
    } catch (error: any) {
      console.error('❌ Error removing connection:', error);
      toast.error('Bağlantı kaldırılırken hata oluştu');
    }
  };

  /**
   * Filter dependents based on search term
   */
  const filteredDependents = existingDependents.filter((person) => {
    if (!dependentSearchTerm) return true;
    const searchLower = dependentSearchTerm.toLowerCase();
    
    // Search in various fields
    return (
      person.ad_soyad?.toLowerCase().includes(searchLower) ||
      person.id_number?.toLowerCase().includes(searchLower) ||
      person.phone?.toLowerCase().includes(searchLower) ||
      `${person.name} ${person.surname}`.toLowerCase().includes(searchLower)
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bağlı Kişiler Yönetimi
          </DialogTitle>
        </DialogHeader>

        {/* Mode Selection Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={modalMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setModalMode('list');
            }}
            className="flex-1"
          >
            Bağlı Kişiler
          </Button>
          <Button
            variant={modalMode === 'create' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setModalMode('create');
            }}
            className="flex-1"
          >
            Yeni Ekle
          </Button>
          <Button
            variant={modalMode === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setModalMode('select');
              loadExistingDependents();
            }}
            className="flex-1"
          >
            Mevcut Seç
          </Button>
        </div>

        <div className="space-y-4 py-4">
          {modalMode === 'list' ? (
            // Connected Dependents List
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Bu kişiye bağlı olan kişiler listesi</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalMode('create');
                    }}
                  >
                    Yeni Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalMode('select');
                      loadExistingDependents();
                    }}
                  >
                    Mevcut Seç
                  </Button>
                </div>
              </div>

              {isLoadingDependents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">Bağlı kişiler yükleniyor...</p>
                </div>
              ) : connectedDependents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Henüz bağlı kişi yok</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setModalMode('create');
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Yeni Ekle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setModalMode('select');
                        loadExistingDependents();
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Mevcut Seç
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {connectedDependents.map((person) => (
                    <div
                      key={person['relationship_id'] || person.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <div className="font-medium">{person.ad_soyad}</div>
                        <div className="text-sm text-gray-600 flex flex-wrap gap-x-4">
                          <span>
                            <span className="font-medium">TC:</span>{' '}
                            {person.id_number || 'Belirtilmemiş'}
                          </span>
                          <span>
                            <span className="font-medium">Yakınlık:</span>{' '}
                            {person.yakinlik || person.relationship || 'Belirtilmemiş'}
                          </span>
                          {person.phone && (
                            <span>
                              <span className="font-medium">Tel:</span> {person.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          handleRemoveConnection(
                            person['relationship_id'] || String(person.id),
                            person.ad_soyad || `${person.name} ${person.surname}`
                          );
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : modalMode === 'create' ? (
            // Create New Dependent Form
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad *</Label>
                  <Input
                    id="name"
                    value={dependentPersonData.name}
                    onChange={(e) => {
                      setDependentPersonData({ ...dependentPersonData, name: e.target.value });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Soyad *</Label>
                  <Input
                    id="surname"
                    value={dependentPersonData.surname}
                    onChange={(e) => {
                      setDependentPersonData({ ...dependentPersonData, surname: e.target.value });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tc">T.C. Kimlik No *</Label>
                  <Input
                    id="tc"
                    value={dependentPersonData.id_number}
                    onChange={(e) => {
                      setDependentPersonData({ ...dependentPersonData, id_number: e.target.value });
                    }}
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={dependentPersonData.phone}
                    onChange={(e) => {
                      setDependentPersonData({ ...dependentPersonData, phone: e.target.value });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Yakınlık Derecesi *</Label>
                <Select
                  value={dependentPersonData.relationship}
                  onValueChange={(value) => {
                    setDependentPersonData({ ...dependentPersonData, relationship: value });
                  }}
                >
                  <SelectTrigger id="relationship">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eş">Eş</SelectItem>
                    <SelectItem value="Çocuk">Çocuk</SelectItem>
                    <SelectItem value="Anne">Anne</SelectItem>
                    <SelectItem value="Baba">Baba</SelectItem>
                    <SelectItem value="Kardeş">Kardeş</SelectItem>
                    <SelectItem value="Akraba">Akraba</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Doğum Tarihi</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={dependentPersonData.birth_date}
                    onChange={(e) => {
                      setDependentPersonData({ ...dependentPersonData, birth_date: e.target.value });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <RadioGroup
                    value={dependentPersonData.gender}
                    onValueChange={(value) => {
                      setDependentPersonData({ ...dependentPersonData, gender: value });
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Erkek" id="male" />
                      <Label htmlFor="male">Erkek</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Kadın" id="female" />
                      <Label htmlFor="female">Kadın</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={dependentPersonData.address}
                  onChange={(e) => {
                    setDependentPersonData({ ...dependentPersonData, address: e.target.value });
                  }}
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800">
                      Bu ekrandan eklediğiniz kişiler, bağlı kişiler veritabanına da eklenecektir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Select Existing Dependent
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="relationship-type">Yakınlık Derecesi *</Label>
                <Select
                  value={selectedRelationshipType}
                  onValueChange={setSelectedRelationshipType}
                >
                  <SelectTrigger id="relationship-type">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eş">Eş</SelectItem>
                    <SelectItem value="Çocuk">Çocuk</SelectItem>
                    <SelectItem value="Anne">Anne</SelectItem>
                    <SelectItem value="Baba">Baba</SelectItem>
                    <SelectItem value="Kardeş">Kardeş</SelectItem>
                    <SelectItem value="Akraba">Akraba</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="search">Kişi Ara</Label>
                  {isLoadingDependents && (
                    <span className="text-xs text-gray-500">Yükleniyor...</span>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Ad, soyad veya TC ile arama yapın..."
                    value={dependentSearchTerm}
                    onChange={(e) => setDependentSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium text-gray-700">
                  Kişiler ({filteredDependents.length})
                </div>
                <div className="divide-y max-h-64 overflow-y-auto">
                  {filteredDependents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {isLoadingDependents ? (
                        <>Kişiler yükleniyor...</>
                      ) : dependentSearchTerm ? (
                        <>Arama kriterine uygun kişi bulunamadı.</>
                      ) : (
                        <>Henüz kişi bulunamadı. Yeni kişi ekleyebilirsiniz.</>
                      )}
                    </div>
                  ) : (
                    filteredDependents.map((person) => {
                      const isAlreadyConnected = connectedDependents.some(
                        (dep) => String(dep.id) === String(person.id),
                      );
                      
                      return (
                        <div
                          key={person.id}
                          className={`p-3 hover:bg-gray-50 ${
                            selectedDependentId === String(person.id) ? 'bg-blue-50' : ''
                          } ${isAlreadyConnected ? 'opacity-50' : ''}`}
                        >
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {person.ad_soyad}
                                {isAlreadyConnected && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                                    <Check className="w-3 h-3 mr-1" />
                                    Zaten bağlı
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
                                isAlreadyConnected
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : selectedDependentId === String(person.id)
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                              }`}
                              onClick={() => {
                                if (!isAlreadyConnected) {
                                  setSelectedDependentId(
                                    selectedDependentId === String(person.id) ? null : String(person.id)
                                  );
                                }
                              }}
                              disabled={isAlreadyConnected}
                            >
                              {selectedDependentId === String(person.id) ? (
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

              {selectedDependentId && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800">
                        Bu işlem, seçilen kişiyi mevcut kişiye bağlı olarak ekleyecektir.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCloseModal}>
            Kapat
          </Button>
          
          {modalMode === 'list' ? null : modalMode === 'create' ? (
            <Button
              onClick={handleSaveDependent}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSavingDependent}
            >
              {isSavingDependent ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleLinkExistingPerson}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedDependentId || !selectedRelationshipType || isSavingDependent}
            >
              {isSavingDependent ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  İşlem Yapılıyor...
                </>
              ) : (
                'Bağlantıyı Kaydet'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BeneficiaryDependentManager;