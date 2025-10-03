/**
 * @fileoverview BeneficiaryDetailPageComprehensive Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  File,
  FileText as FileIcon,
  FileSpreadsheet,
  FileText,
  Filter,
  Grid,
  Heart,
  Image as ImageIcon,
  Info,
  Save,
  Search,
  Shield,
  Target,
  Trash,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
// Removed direct supabase import - using service layer instead
import { ihtiyacSahipleriService } from '../../services/ihtiyacSahipleriService';
import { supabaseAdmin } from '../../lib/supabase';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { sanitizeUrl } from '../../lib/security/sanitization';

import { logger } from '../../lib/logging/logger';
// Health conditions data
const healthConditions = [
  'Akdeniz Anemisi',
  'Alerji',
  'Astım',
  'Bağışıklık Yetm.',
  'Bel Fıtığı',
  'Böbrek Yetmezliği',
  'Bronşit (Kronik)',
  'Depresyon',
  'Diyabet (Şeker)',
  'Düşük Tansiyon',
  'Epilepsi (Sara)',
  'Göz Eriş',
  'Göğüs Hastalıkları',
  'Görme Bozukluğu',
  'Gastrit',
  'Hepatit',
  'Hipertansiyon',
  'Hormonal Düzensizlik',
  'Kalça / Diz Protez',
  'Kalıcı İşitme Engeli',
  'Kalıcı Konuşma Engeli',
  'Kalıcı Yürüme Engeli',
  'Kalp Yetmezliği',
  'Kas/İskelet Hastalıkları',
  'Kanser',
  'Karaciğer Hastalığı',
  'Korunma Zorluğu',
  'Kronik İltihap',
  'Lösemi',
  'Menenjit',
  'Migren',
  'Nefes Darlığı',
  'Obezite',
  'Omurilik Hastalığı',
  'Omuz',
  'Psikoz',
  'Psikolojik Sorun',
  'Raynaud',
  'Romatizma',
  'Sinüzit',
  'Stres',
  'Sağır',
  'Tiroid',
  'Tüberküloz',
  'Ülser',
  'Onkolojik Rahatsızlık',
  'Yaygın Gelişimsel Bozukluklar',
  'Yüksek Tansiyon',
];

// Connected records data
const connectedRecords = [
  'Banka Hesapları',
  'Dokümanlar',
  'Fotoğraflar',
  'Bağışçılar',
  'Bağlı Kişiler',
  'Sponsorlar',
  'Referanslar',
  'Göç/İçine Sınav Takibi',
  'Göç/İçine Sınav Hakkı',
  'Yardım Talepleri',
  'Yapılan Yardımlar',
  'Rıza Beyanları',
  'Sosyal Kartlar',
  'Kart Özeti',
];

interface BeneficiaryDetailPageComprehensiveProps {
  beneficiaryId?: string;
  onBack?: () => void;
}

/**
 * BeneficiaryDetailPageComprehensive function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function BeneficiaryDetailPageComprehensive({
  beneficiaryId,
  onBack,
}: BeneficiaryDetailPageComprehensiveProps) {
  const [editMode, setEditMode] = useState(false);
  const [healthConditionsState, setHealthConditionsState] = useState<Record<string, boolean>>({});
  const [beneficiaryData, setBeneficiaryData] = useState<Record<string, unknown> | null>(null);
  const [editableData, setEditableData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Bank Account Modal States
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [iban, setIban] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [description, setDescription] = useState('');

  // Document Management Modal States
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      id: string;
      name: string;
      type: string;
      size: string;
      uploadDate: string;
      url?: string;
    }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [previewFile, setPreviewFile] = useState<{
    id: string;
    name: string;
    type: string;
    url: string;
    size?: string;
    uploadDate?: string;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Dependent Person Modal States
  const [isDependentPersonModalOpen, setIsDependentPersonModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'list' | 'create' | 'select'>('list'); // Yeni: list modu eklendi
  const [connectedDependents, setConnectedDependents] = useState<
    {
      id: string;
      name: string;
      relationship: string;
      phone?: string;
      ad_soyad?: string;
      tur?: string;
      yakinlik?: string;
      kimlik_no?: string;
      telefon_no?: string;
      baglanti_tarihi?: string;
      relationship_id?: string;
      sehri?: string;
      uyruk?: string;
      Uyruk?: string;
      kategori?: string;
      Kategori?: string;
      Kimlik_No?: string;
      Telefon_No?: string;
      Tur?: string;
    }[]
  >([]); // Bu kişiye bağlı olanlar
  const [existingDependents, setExistingDependents] = useState<
    {
      id: string;
      name: string;
      relationship: string;
      phone?: string;
      ad_soyad?: string;
      tur?: string;
      yakinlik?: string;
      kimlik_no?: string;
      telefon_no?: string;
      baglanti_tarihi?: string;
      relationship_id?: string;
      sehri?: string;
      uyruk?: string;
      Uyruk?: string;
      kategori?: string;
      Kategori?: string;
      Kimlik_No?: string;
      Telefon_No?: string;
      Tur?: string;
    }[]
  >([]); // Mevcut bağlı kişiler
  const [selectedDependentId, setSelectedDependentId] = useState<string | null>(null);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string>('');
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
  const [isSavingDependent, setIsSavingDependent] = useState(false);
  const [isLoadingDependents, setIsLoadingDependents] = useState(false);
  const [dependentSearchTerm, setDependentSearchTerm] = useState('');

  // Photos Modal States
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
  const [photos, setPhotos] = useState<any[]>([
    {
      id: 1,
      name: 'profil_foto.jpg',
      url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20photo%20of%20a%20person&image_size=square',
      size: '2.3 MB',
      uploadDate: '15.01.2024',
      type: 'image/jpeg',
    },
    {
      id: 2,
      name: 'kimlik_foto.jpg',
      url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=identity%20document%20photo&image_size=landscape_4_3',
      size: '1.8 MB',
      uploadDate: '12.01.2024',
      type: 'image/jpeg',
    },
  ]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);

  // Donors Modal States
  const [isDonorsModalOpen, setIsDonorsModalOpen] = useState(false);
  const [donors] = useState([
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      email: 'ahmet@email.com',
      phone: '0532 123 45 67',
      totalDonation: '5,000 TL',
      lastDonation: '15.01.2024',
      donationCount: 3,
    },
    {
      id: 2,
      name: 'Fatma Demir',
      email: 'fatma@email.com',
      phone: '0541 987 65 43',
      totalDonation: '2,500 TL',
      lastDonation: '10.01.2024',
      donationCount: 2,
    },
  ]);
  const [donorSearchTerm, setDonorSearchTerm] = useState('');

  // Sponsors Modal States
  const [isSponsorsModalOpen, setIsSponsorsModalOpen] = useState(false);
  const [sponsors] = useState([
    {
      id: 1,
      name: 'Yardım Derneği',
      type: 'Dernek',
      contact: 'info@yardim.org',
      phone: '0212 123 45 67',
      sponsorshipAmount: '10,000 TL',
      startDate: '01.01.2024',
      endDate: '31.12.2024',
      status: 'Aktif',
    },
  ]);

  // Help Requests Modal States
  const [isHelpRequestsModalOpen, setIsHelpRequestsModalOpen] = useState(false);
  const [helpRequests] = useState([
    {
      id: 1,
      title: 'Gıda Yardımı Talebi',
      description: 'Aylık gıda paketi ihtiyacı',
      status: 'Beklemede',
      requestDate: '10.01.2024',
      priority: 'Yüksek',
      category: 'Gıda',
    },
    {
      id: 2,
      title: 'Kıyafet Yardımı',
      description: 'Kış kıyafetleri ihtiyacı',
      status: 'Tamamlandı',
      requestDate: '05.01.2024',
      priority: 'Orta',
      category: 'Giyim',
    },
  ]);

  // Help Provided Modal States
  const [_isHelpProvidedModalOpen, _setIsHelpProvidedModalOpen] = useState(false);
  const [_helpProvided] = useState([
    {
      id: 1,
      type: 'Gıda Paketi',
      amount: '500 TL',
      date: '15.01.2024',
      description: 'Aylık gıda paketi',
      provider: 'Yardım Derneği',
    },
    {
      id: 2,
      type: 'Nakit Yardım',
      amount: '1,000 TL',
      date: '01.01.2024',
      description: 'Kira yardımı',
      provider: 'Belediye',
    },
  ]);

  // Consent Modal States
  const [_isConsentModalOpen, _setIsConsentModalOpen] = useState(false);
  const [_consents] = useState([
    {
      id: 1,
      type: 'KVKK Aydınlatma Metni',
      status: 'Onaylandı',
      date: '01.01.2024',
      description: 'Kişisel verilerin işlenmesi hakkında bilgilendirme',
    },
    {
      id: 2,
      type: 'Fotoğraf Çekim İzni',
      status: 'Beklemede',
      date: '15.01.2024',
      description: 'Etkinliklerde fotoğraf çekimi için izin',
    },
  ]);

  // Completed Aids Modal States
  const [isCompletedAidsModalOpen, setIsCompletedAidsModalOpen] = useState(false);
  const [completedAids] = useState([
    {
      id: 1,
      type: 'Nakdi',
      amount: '1,500 TL',
      date: '15.01.2024',
      description: 'Aylık gıda yardımı',
      provider: 'Yardım Derneği',
      status: 'Tamamlandı',
      notes: 'Düzenli gıda yardımı paketi teslim edildi',
    },
    {
      id: 2,
      type: 'Ayni',
      amount: '800 TL',
      date: '10.01.2024',
      description: 'Giyim yardımı',
      provider: 'Belediye',
      status: 'Tamamlandı',
      notes: 'Kış kıyafetleri ve ayakkabı teslim edildi',
    },
    {
      id: 3,
      type: 'Hizmet',
      amount: '500 TL',
      date: '05.01.2024',
      description: 'Sağlık hizmeti',
      provider: 'Sağlık Merkezi',
      status: 'Tamamlandı',
      notes: 'Ücretsiz sağlık taraması yapıldı',
    },
  ]);

  // Consent Declarations Modal States
  const [isConsentDeclarationsModalOpen, setIsConsentDeclarationsModalOpen] = useState(false);
  const [consentDeclarations] = useState([
    {
      id: 1,
      type: 'KVKK Rıza Beyanı',
      status: 'Onaylandı',
      date: '01.01.2024',
      description: 'Kişisel verilerin işlenmesi için rıza beyanı',
      documentUrl: '#',
      title: 'KVKK Rıza Beyanı',
      details: 'Kişisel verilerin işlenmesi için rıza beyanı detayları',
    },
    {
      id: 2,
      type: 'Fotoğraf Çekim İzni',
      status: 'Beklemede',
      date: '15.01.2024',
      description: 'Etkinliklerde fotoğraf çekimi için izin belgesi',
      documentUrl: '#',
      title: 'Fotoğraf Çekim İzni',
      details: 'Etkinliklerde fotoğraf çekimi için izin belgesi detayları',
    },
    {
      id: 3,
      type: 'Veri Paylaşım Rızası',
      status: 'Onaylandı',
      date: '10.01.2024',
      description: 'Üçüncü taraflarla veri paylaşımı için rıza',
      documentUrl: '#',
      title: 'Veri Paylaşım Rızası',
      details: 'Üçüncü taraflarla veri paylaşımı için rıza detayları',
    },
  ]);

  // Load beneficiary data
  useEffect(() => {
    const loadBeneficiaryData = async () => {
      if (!beneficiaryId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await ihtiyacSahipleriService.getIhtiyacSahibi(parseInt(beneficiaryId));

        if (result.data) {
          // ad_soyad'ı ad ve soyad olarak ayır
          const fullName = result.data.ad_soyad ?? '';
          const nameParts = fullName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const transformedData = {
            ...result.data,
            name: firstName,
            surname: lastName,
            full_name: fullName,
            id_number: result.data.kimlik_no ?? result.data.Kimlik_No ?? '',
            phone: result.data.telefon_no ?? result.data.Telefon_No ?? '',
            city: result.data.sehri ?? '',
            address: result.data.adres ?? result.data.Adres ?? '',
            nationality: result.data.uyruk ?? result.data.Uyruk ?? '',
            country: result.data.ulkesi ?? 'Türkiye',
            settlement: result.data.yerlesimi ?? result.data.Yerlesimi ?? '',
            neighborhood: result.data.mahalle ?? result.data.Mahalle ?? '',
            category: result.data.kategori ?? result.data.Kategori ?? '',
            aid_type: result.data.tur ?? result.data.Tur ?? '',
            iban: result.data.iban ?? '',
          };

          setBeneficiaryData(transformedData);
          setEditableData(transformedData);
        } else {
          logger.warn('⚠️ Beneficiary not found:', beneficiaryId);
          toast.error('İhtiyaç sahibi bulunamadı');
        }
      } catch (error) {
        logger.error('❌ Error loading beneficiary:', error);
        toast.error('Veri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadBeneficiaryData();
  }, [beneficiaryId]);

  const handleSave = useCallback(async () => {
    if (!editableData || !beneficiaryId) {
      toast.error('Güncellenecek veri bulunamadı');
      return;
    }

    try {
      // Ad ve soyadı birleştir
      const fullName = `${editableData.name ?? ''} ${editableData.surname ?? ''}`.trim();

      const updateData = {
        ad_soyad: fullName,
        kimlik_no: (editableData.id_number as string) || null,
        telefon_no: (editableData.phone as string) || null,
        sehri: (editableData.city as string) || null,
        uyruk: (editableData.nationality as string) || null,
        ulkesi: (editableData.country as string) || null,
        adres: (editableData.address as string) || null,
        yerlesimi: (editableData.settlement as string) || null,
        mahalle: (editableData.neighborhood as string) || null,
        kategori: (editableData.category as string) || null,
        tur: (editableData.aid_type as string) || null,
        iban: (editableData.iban as string) || null,
      };

      const result = await ihtiyacSahipleriService.updateIhtiyacSahibi(
        parseInt(beneficiaryId),
        updateData,
      );

      if (result.error) {
        toast.error(`Güncelleme sırasında hata: ${  result.error}`);
        return;
      }

      // Başarılı güncelleme sonrası veriyi yenile
      setBeneficiaryData(editableData);
      toast.success('İhtiyaç sahibi bilgileri başarıyla güncellendi');
      setEditMode(false);
    } catch (error: unknown) {
      logger.error('❌ Error updating beneficiary:', error);
      toast.error('Güncelleme sırasında beklenmeyen hata oluştu');
    }
  }, [editableData, beneficiaryId]);

  const handleCancel = useCallback(() => {
    // Değişiklikleri iptal et, orijinal veriyi geri yükle
    setEditableData(beneficiaryData);
    setEditMode(false);
    toast.info('Değişiklikler iptal edildi');
  }, [beneficiaryData]);

  // Photos Modal Handlers
  const handleOpenPhotosModal = () => {
    setIsPhotosModalOpen(true);
  };
  const handleClosePhotosModal = () => {
    setIsPhotosModalOpen(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {files} = event.target;
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
            id: (photos?.length ?? 0) + index + 1,
            name: file.name,
            url: URL.createObjectURL(file),
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: new Date().toLocaleDateString('tr-TR'),
            type: file.type,
          }));

          setPhotos((prev) => [...(prev || []), ...newPhotos]);
          toast.success(`${files.length} fotoğraf başarıyla yüklendi`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handlePhotoPreview = (photo: any) => {
    setSelectedPhoto(photo);
    setIsPhotoPreviewOpen(true);
  };

  const handlePhotoDelete = (photoId: number) => {
    setPhotos((prev) => (prev || []).filter((photo) => photo.id !== photoId));
    toast.success('Fotoğraf silindi');
  };

  const handlePhotoDownload = (photo: any) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    link.click();
    toast.success('Fotoğraf indirildi');
  };

  // Donors Modal Handlers
  const handleOpenDonorsModal = () => {
    setIsDonorsModalOpen(true);
  };
  const handleCloseDonorsModal = () => {
    setIsDonorsModalOpen(false);
  };

  // Sponsors Modal Handlers
  const handleOpenSponsorsModal = () => {
    setIsSponsorsModalOpen(true);
  };
  const handleCloseSponsorsModal = () => {
    setIsSponsorsModalOpen(false);
  };

  // Help Requests Modal Handlers
  const handleOpenHelpRequestsModal = () => {
    setIsHelpRequestsModalOpen(true);
  };
  const handleCloseHelpRequestsModal = () => {
    setIsHelpRequestsModalOpen(false);
  };

  // Help Provided Modal Handlers
  const handleOpenHelpProvidedModal = () => {
    _setIsHelpProvidedModalOpen(true);
  };
  const _handleCloseHelpProvidedModal = () => {
    _setIsHelpProvidedModalOpen(false);
  };

  // Consent Modal Handlers
  const handleOpenConsentModal = () => {
    _setIsConsentModalOpen(true);
  };
  const _handleCloseConsentModal = () => {
    _setIsConsentModalOpen(false);
  };

  // Completed Aids Modal Handlers
  const _handleOpenCompletedAidsModal = () => {
    setIsCompletedAidsModalOpen(true);
  };
  const handleCloseCompletedAidsModal = () => {
    setIsCompletedAidsModalOpen(false);
  };

  // Consent Declarations Modal Handlers
  const _handleOpenConsentDeclarationsModal = () => {
    setIsConsentDeclarationsModalOpen(true);
  };
  const handleCloseConsentDeclarationsModal = () => {
    setIsConsentDeclarationsModalOpen(false);
  };

  // Filter functions
  const filteredDonors =
    donors?.filter(
      (donor) =>
        donor.name.toLowerCase().includes(donorSearchTerm.toLowerCase()) ||
        donor.email.toLowerCase().includes(donorSearchTerm.toLowerCase()),
    ) || [];

  // Bağlı kişiler filtreleme
  const filteredDependents = existingDependents.filter((person) => {
    if (!dependentSearchTerm) return true;
    const searchLower = dependentSearchTerm.toLowerCase();
    return (
      person.ad_soyad?.toLowerCase().includes(searchLower) ||
      person.kimlik_no?.toLowerCase().includes(searchLower) ||
      person.Kimlik_No?.toLowerCase().includes(searchLower) ||
      person.telefon_no?.toLowerCase().includes(searchLower) ||
      person.Telefon_No?.toLowerCase().includes(searchLower) ||
      person.sehri?.toLowerCase().includes(searchLower) ||
      person.uyruk?.toLowerCase().includes(searchLower) ||
      person.Uyruk?.toLowerCase().includes(searchLower)
    );
  });

  const handleHealthConditionChange = useCallback((condition: string, checked: boolean) => {
    setHealthConditionsState((prev) => ({
      ...prev,
      [condition]: checked,
    }));
  }, []);

  // IBAN validation function
  const validateIban = (iban: string): boolean => {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    if (!cleanIban.startsWith('TR') || cleanIban.length !== 26) {
      return false;
    }
    return /^TR\d{24}$/.test(cleanIban);
  };

  // Bank Account Modal Handlers
  const handleOpenBankAccountModal = () => {
    // Mevcut IBAN'ı modal'a yükle
    setIban((beneficiaryData?.iban as string) || '');
    setAccountHolder((beneficiaryData?.ad_soyad as string) || '');
    setBankName(''); // Banka adı ayrı tutulmadığı için boş
    setDescription('');
    setIsBankAccountModalOpen(true);
  };

  const handleCloseBankAccountModal = () => {
    setIsBankAccountModalOpen(false);
    setIban('');
    setBankName('');
    setAccountHolder('');
    setDescription('');
  };

  const handleSaveBankAccount = async () => {
    if (!iban.trim()) {
      toast.error('IBAN alanı zorunludur');
      return;
    }

    if (!validateIban(iban)) {
      toast.error('Geçerli bir IBAN giriniz (TR ile başlamalı ve 26 karakter olmalı)');
      return;
    }

    if (!accountHolder.trim()) {
      toast.error('Hesap sahibi adı alanı zorunludur');
      return;
    }

    try {
      // IBAN'ı ihtiyac_sahipleri tablosuna kaydet
      const result = await ihtiyacSahipleriService.updateIhtiyacSahibi(
        parseInt(beneficiaryId ?? '0'),
        { iban: iban.trim() },
      );

      if (result.error) {
        toast.error(`IBAN kaydedilirken hata: ${  result.error}`);
        return;
      }

      // Başarılı kayıt sonrası veriyi güncelle
      setBeneficiaryData((prev: any) => ({ ...prev, iban: iban.trim() }));
      setEditableData((prev: any) => ({ ...prev, iban: iban.trim() }));

      toast.success('Banka hesabı bilgileri başarıyla kaydedildi');
      handleCloseBankAccountModal();
    } catch (error: any) {
      logger.error('❌ Error saving IBAN:', error);
      toast.error('IBAN kaydedilirken beklenmeyen hata oluştu');
    }
  };

  // Document Management Modal Handlers
  const handleOpenDocumentModal = () => {
    setIsDocumentModalOpen(true);
    // Load existing documents (mock data)
    setUploadedFiles([
      {
        id: '1',
        name: 'kimlik_fotokopisi.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: '#',
      },
      {
        id: '2',
        name: 'gelir_belgesi.jpg',
        size: '1.8 MB',
        type: 'image/jpeg',
        uploadDate: '2024-01-14',
        url: '#',
      },
    ]);
  };

  const handleCloseDocumentModal = () => {
    setIsDocumentModalOpen(false);
    setSearchTerm('');
    setSelectedFileType('all');
    setPreviewFile(null);
    setIsPreviewOpen(false);
  };

  // Dependent Person Modal Handlers
  const handleOpenDependentPersonModal = async () => {
    setModalMode('list'); // Önce bağlı kişiler listesini göster
    await ensureFamilyRelationshipsPolicies(); // Policy'leri kontrol et
    loadConnectedDependents(); // Bu kişiye bağlı olanları yükle
    setIsDependentPersonModalOpen(true);
  };

  // family_relationships tablosu için gerekli policy'leri oluştur
  const ensureFamilyRelationshipsPolicies = async () => {
    try {
      // Policy'leri admin client ile oluştur
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
          logger.info('✅ Policy created:', policy.name);
        } catch (_error: any) {
          // Policy zaten varsa hata verebilir, bu normal
          logger.info('ℹ️ Policy might already exist:', policy.name);
        }
      }
    } catch (error: any) {
      logger.warn('⚠️ Could not create policies (might already exist):', error.message);
    }
  };

  // Bu kişiye bağlı olanları yükle - şimdilik boş liste
  const loadConnectedDependents = async () => {
    if (!beneficiaryId) {
      setConnectedDependents([]);
      return;
    }

    try {
      logger.info('🔄 Loading connected dependents for beneficiary:', beneficiaryId);

      // Integer ID'yi UUID'ye çevir ve family_relationships tablosundan çek
      const primaryUuid = `00000000-0000-0000-0000-${beneficiaryId.toString().padStart(12, '0')}`;

      logger.info('🔄 Searching relationships for UUID:', primaryUuid);

      const { data: relationships, error } = await supabaseAdmin
        .from('family_relationships')
        .select('*')
        .eq('primary_beneficiary_id', primaryUuid);

      if (error) {
        logger.error('❌ Error loading relationships:', error);
        setConnectedDependents([]);
        return;
      }

      if (relationships && relationships.length > 0) {
        const connectedData = [];

        // Her ilişki için kişi detaylarını çek
        for (const rel of relationships) {
          // UUID'yi integer'a çevir
          const memberId = parseInt(rel.family_member_id.split('-').pop() || '0');
          const personResult = await ihtiyacSahipleriService.getIhtiyacSahibi(memberId);

          if (personResult.data) {
            // Enum değerlerini Türkçe'ye çevir
            const relationshipMap: Record<string, string> = {
              parent: 'Anne/Baba',
              spouse: 'Eş',
              child: 'Çocuk',
              sibling: 'Kardeş',
              grandparent: 'Büyükanne/Büyükbaba',
              grandchild: 'Torun',
              other: 'Diğer',
            };

            connectedData.push({
              id: personResult.data.id.toString(),
              name: personResult.data.ad_soyad ?? '',
              relationship:
                (relationshipMap[rel.relationship_type] || rel.relationship_type) ?? 'Belirtilmemiş',
              phone: personResult.data.telefon_no ?? personResult.data.Telefon_No ?? undefined,
              ad_soyad: personResult.data.ad_soyad ?? '',
              tur: personResult.data.tur ?? personResult.data.Tur ?? undefined,
              yakinlik:
                (relationshipMap[rel.relationship_type] || rel.relationship_type) ?? 'Belirtilmemiş',
              kimlik_no: personResult.data.kimlik_no ?? personResult.data.Kimlik_No ?? undefined,
              telefon_no: personResult.data.telefon_no ?? personResult.data.Telefon_No ?? undefined,
              baglanti_tarihi: rel.created_at?.split('T')[0] || '2024-01-01',
              relationship_id: rel.id ?? '',
              sehri: personResult.data.sehri ?? undefined,
              uyruk: personResult.data.uyruk ?? personResult.data.Uyruk ?? undefined,
              Uyruk: personResult.data.Uyruk ?? undefined,
              kategori: personResult.data.kategori ?? personResult.data.Kategori ?? undefined,
              Kategori: personResult.data.Kategori ?? undefined,
              Kimlik_No: personResult.data.Kimlik_No ?? undefined,
              Telefon_No: personResult.data.Telefon_No ?? undefined,
              Tur: personResult.data.Tur ?? undefined,
            });
          }
        }

        logger.info('✅ Found connected dependents:', connectedData);
        setConnectedDependents(connectedData);
      } else {
        logger.info('ℹ️ No connected dependents found');
        setConnectedDependents([]);
      }
    } catch (error: any) {
      logger.error('❌ Unexpected error loading connected dependents:', error);
      setConnectedDependents([]);
    }
  };

  // Mevcut bağlı kişileri yükle - Bakmakla Yükümlü Olunan Kişi türündeki kayıtlar
  const loadExistingDependents = async () => {
    setIsLoadingDependents(true);
    try {
      // Tüm kişileri getir (bağlantı kurabilmek için)
      const result = await ihtiyacSahipleriService.getIhtiyacSahipleri(
        1, // page
        500, // pageSize - çok daha fazla kayıt getir
        {}, // Tür filtresi yok - tüm kişiler
      );

      if (result.data) {
        logger.info('✅ Loaded existing dependents:', result.data);
        setExistingDependents(
          result.data.map((person: any) => ({
            ...person,
            yakinlik: 'Belirtilmemiş', // Varsayılan yakınlık
            durum: 'Aktif', // Varsayılan durum
          })),
        );
      } else if (result.error) {
        logger.error('❌ Error loading dependents:', result.error);
        toast.error(`Bağlı kişiler yüklenirken hata: ${  result.error}`);
        setExistingDependents([]);
      }
    } catch (error: any) {
      logger.error('❌ Unexpected error loading dependents:', error);
      toast.error('Bağlı kişiler yüklenirken beklenmeyen hata oluştu');
      setExistingDependents([]);
    } finally {
      setIsLoadingDependents(false);
    }
  };

  const handleCloseDependentPersonModal = () => {
    setIsDependentPersonModalOpen(false);
    setModalMode('list'); // Liste moduna dön
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

  const validateTcNumber = (tc: string): boolean => {
    const cleanTc = tc.replace(/\s/g, '');
    return /^\d{11}$/.test(cleanTc);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    return /^(05\d{9}|\+905\d{9})$/.test(cleanPhone);
  };

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

      toast.success('Bakmakla yükümlü kişi başarıyla kaydedildi');
      handleCloseDependentPersonModal();
    } catch (error) {
      logger.error('Error saving dependent person:', error);
      toast.error('Kayıt sırasında hata oluştu');
    } finally {
      setIsSavingDependent(false);
    }
  };

  const handleSaveAndGoToDetail = async () => {
    await handleSaveDependent();
    // Navigate to the new dependent person's detail page
    // This would typically use router navigation
    toast.info('Detay sayfasına yönlendiriliyor...');
  };

  // Mevcut kişiyi bağla - family_relationships tablosuna kaydet
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

      const selectedPerson = existingDependents.find((p) => p.id === selectedDependentId);
      logger.info(
        '🔄 Linking person:',
        selectedPerson?.ad_soyad,
        'to beneficiary:',
        beneficiaryId,
        'relationship:',
        selectedRelationshipType,
      );

      // Integer ID'leri UUID'ye çevir ve family_relationships tablosuna kaydet
      const primaryUuid = `00000000-0000-0000-0000-${beneficiaryId.toString().padStart(12, '0')}`;
      const memberUuid = `00000000-0000-0000-0000-${selectedDependentId
        .toString()
        .padStart(12, '0')}`;

      logger.info('🔄 Converting IDs:', {
        beneficiaryId,
        selectedDependentId,
        primaryUuid,
        memberUuid,
      });

      const { data, error } = await supabaseAdmin
        .from('family_relationships')
        .insert({
          primary_beneficiary_id: primaryUuid,
          family_member_id: memberUuid,
          relationship_type: selectedRelationshipType,
          is_dependent: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Error creating relationship:', error);
        toast.error(`Bağlantı kaydedilirken hata: ${  error.message}`);
        return;
      }

      logger.info('✅ Relationship created:', data);
      toast.success(`${selectedPerson?.ad_soyad} başarıyla bağlandı`);

      // Bağlı kişiler listesini yenile
      await loadConnectedDependents();

      // Liste moduna dön
      setModalMode('list');
      setSelectedDependentId(null);
    } catch (error: any) {
      logger.error('❌ Unexpected error linking person:', error);
      toast.error('Bağlantı sırasında beklenmeyen hata oluştu');
    } finally {
      setIsSavingDependent(false);
    }
  };

  // Bağlantıyı kaldır - localStorage'dan
  const handleRemoveConnection = async (relationshipId: string, personName: string) => {
    try {
      logger.info('🔄 Removing relationship:', relationshipId);

      const { error } = await supabaseAdmin
        .from('family_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) {
        logger.error('❌ Error removing relationship:', error);
        toast.error(`Bağlantı kaldırılırken hata: ${  error.message}`);
        return;
      }

      logger.info('✅ Relationship removed:', relationshipId);
      toast.success(`${personName} ile bağlantı kaldırıldı`);

      // Bağlı kişiler listesini yenile
      await loadConnectedDependents();
    } catch (error: any) {
      logger.error('❌ Unexpected error removing relationship:', error);
      toast.error('Bağlantı kaldırılırken beklenmeyen hata oluştu');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {files} = event.target;
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
            id: (Date.now() + index).toString(),
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)  } MB`,
            type: file.type,
            uploadDate: new Date().toISOString().split('T')[0],
            url: URL.createObjectURL(file),
          }));

          setUploadedFiles((prev) => [...(prev || []), ...newFiles]);
          toast.success(`${files.length} dosya başarıyla yüklendi`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles((prev) => (prev || []).filter((file) => file.id !== fileId));
    toast.success('Dosya başarıyla silindi');
  };

  const handlePreviewFile = (file: any) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleDownloadFile = (file: any) => {
    // Simulate download
    toast.success(`${file.name} indiriliyor...`);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (fileType.includes('pdf')) return <FileIcon className="w-4 h-4" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel'))
      return <FileSpreadsheet className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const filteredFiles =
    uploadedFiles?.filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        selectedFileType === 'all' ||
        (selectedFileType === 'image' && file.type.startsWith('image/')) ||
        (selectedFileType === 'pdf' && file.type.includes('pdf')) ||
        (selectedFileType === 'document' &&
          !file.type.startsWith('image/') &&
          !file.type.includes('pdf'));
      return matchesSearch && matchesType;
    }) || [];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-gray-600">İhtiyaç sahibi bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Show error state if no beneficiary data and not loading
  if (!loading && !beneficiaryData) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">İhtiyaç Sahibi Bulunamadı</h2>
          <p className="text-sm text-gray-600 mb-4">Belirtilen ID ile bir kayıt bulunamadı.</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Geri Dön
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3">
          {/* Sol taraf - Başlık */}
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {beneficiaryData ? (
                <>
                  {/* Türüne göre dinamik başlık */}
                  {(() => {
                    const tur =
                      (beneficiaryData.tur as string) ||
                      (beneficiaryData.Tur as string) ||
                      'İhtiyaç Sahibi';
                    const displayType = tur.includes('Bakmakla Yükümlü')
                      ? 'Bakmakla Yükümlü Olunan Kişi'
                      : tur.includes('İhtiyaç Sahibi')
                        ? 'İhtiyaç Sahibi'
                        : tur; // Diğer türler olduğu gibi gösterilir

                    return `${displayType} - Dosya No: #${beneficiaryData.id}`;
                  })()}
                </>
              ) : (
                `Yükleniyor... - Dosya No: #${beneficiaryId}`
              )}
            </h1>
          </div>

          {/* Sağ taraf - Butonlar */}
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </Button>
                <Button
                  onClick={handleCancel}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </Button>
              </>
            ) : (
              <>
                {onBack && (
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium rounded-md border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    ← Geri
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setEditMode(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Düzenle
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-4 px-4 py-4">
        {/* Main Form Content */}
        <section className="col-span-12 lg:col-span-9 flex flex-col gap-4">
          {/* Personal Information Section */}
          <Card className="shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-8">
              <div className="grid grid-cols-12 gap-6">
                {/* Photo Section */}
                <div className="col-span-12 sm:col-span-3">
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-800 block">Fotoğraf</Label>
                    <div className="photo-upload-area bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200" />
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Upload className="w-3 h-3 mr-1" />
                        Ekle
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Sil
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Edit3 className="w-3 h-3 mr-1" />
                        Düzenle
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-800 block">Öncelik</Label>
                      <Select
                        disabled={!editMode}
                        value={(beneficiaryData?.priority_level as string) || 'medium'}
                      >
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue
                            placeholder={
                              beneficiaryData?.priority_level === 'high'
                                ? 'Yüksek'
                                : beneficiaryData?.priority_level === 'medium'
                                  ? 'Orta'
                                  : beneficiaryData?.priority_level === 'low'
                                    ? 'Düşük'
                                    : 'Yok'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="low">Düşük</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Identity Information */}
                <div className="col-span-12 sm:col-span-9 grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-6 grid grid-cols-12 gap-4">
                    {/* Country & Status */}
                    <div className="col-span-4 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Ülke</Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="Türkiye" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tr">Türkiye</SelectItem>
                          <SelectItem value="sy">Suriye</SelectItem>
                          <SelectItem value="iq">Irak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-8 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Durum</Label>
                      <Select
                        disabled={!editMode}
                        value={(beneficiaryData?.status as string) || 'under_evaluation'}
                      >
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue
                            placeholder={
                              beneficiaryData?.status === '1' ||
                              beneficiaryData?.status === 'active'
                                ? 'Aktif'
                                : beneficiaryData?.status === '0' ||
                                    beneficiaryData?.status === 'under_evaluation'
                                  ? 'Değerlendirmede'
                                  : beneficiaryData?.status === '2' ||
                                      beneficiaryData?.status === 'passive'
                                    ? 'Pasif'
                                    : beneficiaryData?.status === 'suspended'
                                      ? 'Askıda'
                                      : 'Değerlendirmede'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under_evaluation">Değerlendirmede</SelectItem>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="passive">Pasif</SelectItem>
                          <SelectItem value="suspended">Askıda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Name Fields */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Adı</Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Ad giriniz"
                        value={(editableData?.name as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({ ...prev, name: e.target.value }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Soyadı</Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Soyad giriniz"
                        value={(editableData?.surname as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({ ...prev, surname: e.target.value }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    {/* Nationality & Country */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Uyruk</Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Uyruk giriniz"
                        value={(editableData?.nationality as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({
                            ...prev,
                            nationality: e.target.value,
                          }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Ülke</Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Ülke giriniz"
                        value={(editableData?.country as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({ ...prev, country: e.target.value }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    {/* Email */}
                    <div className="col-span-12 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        E-Posta Adresi
                      </Label>
                      <Input
                        type="email"
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="E-posta giriniz"
                        readOnly={!editMode}
                      />
                    </div>

                    {/* ID Number & Central Control */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Kimlik No</Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Kimlik No"
                        value={(editableData?.id_number as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({ ...prev, id_number: e.target.value }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    <div className="col-span-6 space-y-2 flex items-end">
                      <Button
                        variant="link"
                        className="inline-action-link h-10 px-0 text-sm text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200"
                        disabled={!editMode}
                      >
                        Merkezi Kontrolü Yap
                      </Button>
                    </div>

                    {/* Marital Status & Religion */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Medeni Hâli
                      </Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="Bekâr" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Bekâr</SelectItem>
                          <SelectItem value="married">Evli</SelectItem>
                          <SelectItem value="divorced">Boşanmış</SelectItem>
                          <SelectItem value="widowed">Dul</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Din</Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="İnanç" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="islam">İslam</SelectItem>
                          <SelectItem value="christianity">Hristiyanlık</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Spouse & Parent Info */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Eş Bilgisi
                      </Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="Yok" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="exists">Var</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Baba / Anne
                      </Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          <SelectItem value="father">Baba</SelectItem>
                          <SelectItem value="mother">Anne</SelectItem>
                          <SelectItem value="both">Her ikisi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sponsorship & File Number */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Sponsorluk Türü
                      </Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="Yok" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="individual">Bireysel</SelectItem>
                          <SelectItem value="corporate">Kurumsal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Dosya Numarası
                      </Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 bg-gray-50 font-medium text-gray-700"
                        value={beneficiaryData?.id ? `#${beneficiaryData.id}` : ''}
                        placeholder="Dosya No"
                        readOnly={true}
                      />
                      <p className="text-xs text-gray-500">Sistem tarafından otomatik atanır</p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="col-span-12 md:col-span-6 grid grid-cols-12 gap-3">
                    {/* Phone Number */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Cep Telefonu
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-sm text-gray-600">
                          +90
                        </span>
                        <Input
                          className="h-10 text-sm rounded-l-none border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          placeholder="5XX XXX XX XX"
                          value={(editableData?.phone as string) || ''}
                          onChange={(e) => {
                            setEditableData((prev: any) => ({ ...prev, phone: e.target.value }));
                          }}
                          readOnly={!editMode}
                        />
                      </div>
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        İletişim Tercihi
                      </Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="Telefon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Telefon</SelectItem>
                          <SelectItem value="email">E-posta</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Şehir / Bölge
                      </Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Şehir giriniz"
                        value={(editableData?.city as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({ ...prev, city: e.target.value }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Yerleşim</Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Yerleşim yeri giriniz"
                        value={(editableData?.settlement as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({ ...prev, settlement: e.target.value }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Mahalle</Label>
                      <Input
                        className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Mahalle giriniz"
                        value={(editableData?.neighborhood as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({
                            ...prev,
                            neighborhood: e.target.value,
                          }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Mahalle / Köy
                      </Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Address */}
                    <div className="col-span-12 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">Adres</Label>
                      <Textarea
                        className="text-sm resize-none border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        rows={3}
                        placeholder="Adres detayı"
                        value={(editableData?.address as string) || ''}
                        onChange={(e) => {
                          setEditableData((prev: any) => ({ ...prev, address: e.target.value }));
                        }}
                        readOnly={!editMode}
                      />
                    </div>

                    {/* Housing & Records */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Ev / Arazi
                      </Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="Kiracı" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant">Kiracı</SelectItem>
                          <SelectItem value="owner">Ev Sahibi</SelectItem>
                          <SelectItem value="guest">Misafir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-6 space-y-2 flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="delete-record" disabled={!editMode} />
                        <Label
                          htmlFor="delete-record"
                          className="text-sm font-semibold text-gray-800"
                        >
                          Kaydı Sil
                        </Label>
                      </div>
                    </div>

                    {/* Family Information */}
                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Bağlı Yetim
                      </Label>
                      <Select disabled={!editMode}>
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue placeholder="Yok" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="exists">Var</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-6 space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 block">
                        Ailedeki Kişi Sayısı
                      </Label>
                      <Select
                        disabled={!editMode}
                        value={(beneficiaryData?.family_size as number)?.toString() || ''}
                      >
                        <SelectTrigger className="h-10 text-sm border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                          <SelectValue
                            placeholder={
                              (beneficiaryData?.family_size as number)?.toString() || '—'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="8">8+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Cards */}
          <div className="grid grid-cols-12 gap-4">
            {/* Identity Information */}
            <Card className="col-span-12 md:col-span-6 xl:col-span-3 shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Kimlik Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Baba Adı</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    value={(editableData?.baba_adi as string) || ''}
                    onChange={(e) => {
                      setEditableData((prev: any) => ({ ...prev, baba_adi: e.target.value }));
                    }}
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Anne Adı</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    value={(editableData?.anne_adi as string) || ''}
                    onChange={(e) => {
                      setEditableData((prev: any) => ({ ...prev, anne_adi: e.target.value }));
                    }}
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">İkametgah</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Kimlik Belgesi Türü</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Kimlik Kartı</SelectItem>
                      <SelectItem value="passport">Pasaport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Kimlik Veriliş Yeri</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Seri Numarası</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Önceki Unvanı (Varsa)</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Önceki İsmi (Varsa)</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Yok" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Yok</SelectItem>
                      <SelectItem value="exists">Var</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Passport and Visa */}
            <Card className="col-span-12 md:col-span-6 xl:col-span-3 shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Pasaport ve Vize
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Pasaport Türü</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Pasaport Numarası</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Pasaport Geçerlilik Tarihi
                  </Label>
                  <Input
                    type="date"
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Vize Geçiş Tarihi</Label>
                  <Input
                    type="date"
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Vize Bitiş Tarihi</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Giriş / Çıkış Bilgileri
                  </Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Yerel Dönüş Bilgisi</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personal Data */}
            <Card className="col-span-12 md:col-span-6 xl:col-span-3 shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Kişisel Veriler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Cinsiyet</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Kadın" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Kadın</SelectItem>
                      <SelectItem value="male">Erkek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Doğum Tarihi</Label>
                  <Input
                    type="date"
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    value={(editableData?.dogum_tarihi as string) || ''}
                    onChange={(e) => {
                      setEditableData((prev: any) => ({ ...prev, dogum_tarihi: e.target.value }));
                    }}
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Doğum Yeri</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    value={(editableData?.dogum_yeri as string) || ''}
                    onChange={(e) => {
                      setEditableData((prev: any) => ({ ...prev, dogum_yeri: e.target.value }));
                    }}
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Kan Grubu</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a+">A Rh+</SelectItem>
                      <SelectItem value="a-">A Rh-</SelectItem>
                      <SelectItem value="b+">B Rh+</SelectItem>
                      <SelectItem value="b-">B Rh-</SelectItem>
                      <SelectItem value="ab+">AB Rh+</SelectItem>
                      <SelectItem value="ab-">AB Rh-</SelectItem>
                      <SelectItem value="o+">0 Rh+</SelectItem>
                      <SelectItem value="o-">0 Rh-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Eğitim Durumu</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Okur-yazar değil</SelectItem>
                      <SelectItem value="primary">İlkokul</SelectItem>
                      <SelectItem value="secondary">Ortaokul</SelectItem>
                      <SelectItem value="high">Lise</SelectItem>
                      <SelectItem value="university">Üniversite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Medeni Hâl</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Bekâr</SelectItem>
                      <SelectItem value="married">Evli</SelectItem>
                      <SelectItem value="divorced">Boşanmış</SelectItem>
                      <SelectItem value="widowed">Dul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Din</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="islam">İslam</SelectItem>
                      <SelectItem value="christianity">Hristiyanlık</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Askerlik Kaydı</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Yok" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Yok</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                      <SelectItem value="exempt">Muaf</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Work and Income */}
            <Card className="col-span-12 md:col-span-6 xl:col-span-3 shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  İş ve Gelir Durumu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Yaşadığı Yer</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Kira" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Kira</SelectItem>
                      <SelectItem value="owned">Ev Sahibi</SelectItem>
                      <SelectItem value="guest">Misafir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Aylık Gelir</Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Aylık Gider</Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      readOnly={!editMode}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Sosyal Güvence</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Yok" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Yok</SelectItem>
                      <SelectItem value="sgk">SGK</SelectItem>
                      <SelectItem value="private">Özel Sigorta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Çalıştığı Sektör</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="trade">Ticaret</SelectItem>
                      <SelectItem value="construction">İnşaat</SelectItem>
                      <SelectItem value="service">Hizmet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">İş Durumu</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="İşsiz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unemployed">İşsiz</SelectItem>
                      <SelectItem value="employed">Çalışıyor</SelectItem>
                      <SelectItem value="retired">Emekli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Meslek Tanımı (kısa)</Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    readOnly={!editMode}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">İlave Açıklamalar</Label>
                  <Textarea
                    className="text-sm resize-none border border-gray-300 focus:border-blue-500"
                    rows={2}
                    readOnly={!editMode}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="simple-trade" disabled={!editMode} />
                    <Label htmlFor="simple-trade" className="text-xs">
                      Basit Ticaret
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="gov-aid" disabled={!editMode} />
                    <Label htmlFor="gov-aid" className="text-xs">
                      Devlet Yardımı
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="family-aid" disabled={!editMode} />
                    <Label htmlFor="family-aid" className="text-xs">
                      Aile Yardımı / Burs
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="regular-aid" disabled={!editMode} />
                    <Label htmlFor="regular-aid" className="text-xs">
                      Düzenli İnfak / İyilet.
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="agricultural" disabled={!editMode} />
                    <Label htmlFor="agricultural" className="text-xs">
                      Tarımsal Gelir
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Status */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                Sağlık Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Kan Grubu</Label>
                    <Select disabled={!editMode}>
                      <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a+">A Rh+</SelectItem>
                        <SelectItem value="a-">A Rh-</SelectItem>
                        <SelectItem value="b+">B Rh+</SelectItem>
                        <SelectItem value="b-">B Rh-</SelectItem>
                        <SelectItem value="ab+">AB Rh+</SelectItem>
                        <SelectItem value="ab-">AB Rh-</SelectItem>
                        <SelectItem value="o+">0 Rh+</SelectItem>
                        <SelectItem value="o-">0 Rh-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Sigara Kullanımı</Label>
                    <Select disabled={!editMode}>
                      <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Kullanmıyor</SelectItem>
                        <SelectItem value="occasional">Ara sıra</SelectItem>
                        <SelectItem value="regular">Düzenli</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Engel Durumu</Label>
                    <Select disabled={!editMode}>
                      <SelectTrigger className="h-9 text-sm border border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Yok</SelectItem>
                        <SelectItem value="physical">Fiziksel</SelectItem>
                        <SelectItem value="mental">Zihinsel</SelectItem>
                        <SelectItem value="visual">Görme</SelectItem>
                        <SelectItem value="hearing">İşitme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-gray-700">
                      Kullanılan Protezler
                    </Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-gray-700">
                      Düzenli Kullanılan İlaçlar
                    </Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-gray-700">
                      Geçirilen Ameliyatlar
                    </Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-gray-700">
                      İlgili Notlar/Açıklamalar
                    </Label>
                    <Textarea
                      className="text-sm resize-none border border-gray-300 focus:border-blue-500"
                      rows={3}
                      readOnly={!editMode}
                    />
                  </div>
                </div>

                {/* Health Conditions */}
                <div className="col-span-12 lg:col-span-8">
                  <div className="health-conditions-grid">
                    {healthConditions.map((condition) => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={`health-${condition}`}
                          checked={healthConditionsState[condition] ?? false}
                          onCheckedChange={(checked: boolean) => {
                            handleHealthConditionChange(condition, checked);
                          }}
                          disabled={!editMode}
                        />
                        <Label
                          htmlFor={`health-${condition}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          {condition}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Row: Emergency, Tags, Special, Record */}
          <div className="grid grid-cols-12 gap-4">
            {/* Emergency Contact */}
            <Card className="col-span-12 lg:col-span-4 shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  Acil Durum İletişimi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    İletişime Geçilecek 1 (Yakın) Adı
                  </Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    value={(editableData?.acil_iletisim_1_ad as string) || ''}
                    onChange={(e) => {
                      setEditableData((prev: any) => ({
                        ...prev,
                        acil_iletisim_1_ad: e.target.value,
                      }));
                    }}
                    readOnly={!editMode}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Yakınlığı</Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      value={(editableData?.acil_iletisim_1_yakinlik as string) || ''}
                      onChange={(e) => {
                        setEditableData((prev: any) => ({
                          ...prev,
                          acil_iletisim_1_yakinlik: e.target.value,
                        }));
                      }}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Telefon</Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      value={(editableData?.acil_iletisim_1_telefon as string) || ''}
                      onChange={(e) => {
                        setEditableData((prev: any) => ({
                          ...prev,
                          acil_iletisim_1_telefon: e.target.value,
                        }));
                      }}
                      readOnly={!editMode}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    İletişime Geçilecek 2 (Yakın) Adı
                  </Label>
                  <Input
                    className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                    value={(editableData?.acil_iletisim_2_ad as string) || ''}
                    onChange={(e) => {
                      setEditableData((prev: any) => ({
                        ...prev,
                        acil_iletisim_2_ad: e.target.value,
                      }));
                    }}
                    readOnly={!editMode}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Yakınlığı</Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      value={(editableData?.acil_iletisim_2_yakinlik as string) || ''}
                      onChange={(e) => {
                        setEditableData((prev: any) => ({
                          ...prev,
                          acil_iletisim_2_yakinlik: e.target.value,
                        }));
                      }}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Telefon</Label>
                    <Input
                      className="h-9 text-sm border border-gray-300 focus:border-blue-500"
                      value={(editableData?.acil_iletisim_2_telefon as string) || ''}
                      onChange={(e) => {
                        setEditableData((prev: any) => ({
                          ...prev,
                          acil_iletisim_2_telefon: e.target.value,
                        }));
                      }}
                      readOnly={!editMode}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="col-span-12 lg:col-span-4 shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Etiketler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="regular-aid-allowed" disabled={!editMode} />
                    <Label htmlFor="regular-aid-allowed" className="text-xs">
                      Düzenli Yardım Yapılabilir
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="support-rejected" disabled={!editMode} />
                    <Label htmlFor="support-rejected" className="text-xs">
                      Destek Başvuruları Reddedilmeli
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="false-documents" disabled={!editMode} />
                    <Label htmlFor="false-documents" className="text-xs">
                      Sahte Evrak Girişi / Yalan Beyanda Bulundu
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Situations */}
            <Card className="col-span-12 lg:col-span-4 shadow-sm border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Özel Durumlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup disabled={!editMode}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="earthquake-victim" id="earthquake-victim" />
                    <Label htmlFor="earthquake-victim" className="text-xs">
                      Depremzede
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not-earthquake-victim" id="not-earthquake-victim" />
                    <Label htmlFor="not-earthquake-victim" className="text-xs">
                      Depremzede Değil
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Record Information */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Kayıt Bilgisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Kayıt Zamanı</Label>
                  <Input className="h-9 text-sm bg-muted/30" placeholder="—" readOnly />
                </div>
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Kayıt Eden</Label>
                  <Input className="h-9 text-sm bg-muted/30" placeholder="—" readOnly />
                </div>
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs font-medium text-gray-700">IP Adresi</Label>
                  <Input className="h-9 text-sm bg-muted/30" placeholder="—" readOnly />
                </div>
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Toplam Yardım (₺)</Label>
                  <Input
                    className="h-9 text-sm bg-muted/30 font-medium"
                    placeholder="0,00"
                    readOnly
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                1. İşaretlemeli veriler, bakmakla yükümlü olan ve olunan kişilerle ortaktır.
                Herhangi birisinde güncelleme, hepsinde aynı şekilde güncellenir.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Connected Records Sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <Card className="shadow-sm border-0 bg-white h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Bağlantılı Kayıtlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="connected-records-grid">
                {connectedRecords?.map((record) => (
                  <Button
                    key={record}
                    variant="outline"
                    className="connected-record-button border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary"
                    title=""
                    onClick={
                      record === 'Banka Hesapları'
                        ? handleOpenBankAccountModal
                        : record === 'Dokümanlar'
                          ? handleOpenDocumentModal
                          : record === 'Bağlı Kişiler'
                            ? handleOpenDependentPersonModal
                            : record === 'Fotoğraflar'
                              ? handleOpenPhotosModal
                              : record === 'Bağışçılar'
                                ? handleOpenDonorsModal
                                : record === 'Sponsorlar'
                                  ? handleOpenSponsorsModal
                                  : record === 'Yardım Talepleri'
                                    ? handleOpenHelpRequestsModal
                                    : record === 'Yapılan Yardımlar'
                                      ? handleOpenHelpProvidedModal
                                      : record === 'Rıza Beyanları'
                                        ? handleOpenConsentModal
                                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{record}</span>
                      {record === 'Banka Hesapları' && (beneficiaryData?.iban as string) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full ml-2" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Bank Account Modal */}
      <Dialog open={isBankAccountModalOpen} onOpenChange={setIsBankAccountModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Banka Hesabı Bilgileri</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="iban" className="text-sm font-medium">
                IBAN *
              </Label>
              <Input
                id="iban"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                value={iban}
                onChange={(e) => {
                  setIban(e.target.value);
                }}
                className="h-10"
                maxLength={34}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-sm font-medium">
                Banka Adı *
              </Label>
              <Input
                id="bankName"
                placeholder="Banka adını giriniz"
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value);
                }}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolder" className="text-sm font-medium">
                Hesap Sahibi Adı *
              </Label>
              <Input
                id="accountHolder"
                placeholder="Hesap sahibinin adını giriniz"
                value={accountHolder}
                onChange={(e) => {
                  setAccountHolder(e.target.value);
                }}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Açıklama
              </Label>
              <Textarea
                id="description"
                placeholder="Ek açıklama giriniz (opsiyonel)"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseBankAccountModal} className="px-6">
              İptal
            </Button>
            <Button onClick={handleSaveBankAccount} className="px-6 bg-blue-600 hover:bg-blue-700">
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Management Modal */}
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
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
              {filteredFiles?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Henüz dosya yüklenmemiş</p>
                </div>
              ) : (
                filteredFiles?.map((file) => (
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
              <span>Toplam {uploadedFiles?.length ?? 0} dosya</span>
              <span>
                Toplam boyut:{' '}
                {(uploadedFiles || [])
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
            <Button variant="outline" onClick={handleCloseDocumentModal} className="px-6">
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
                {/* deepcode ignore DOMXSS: URL is sanitized with sanitizeUrl() to prevent XSS attacks */}
                <img
                  src={sanitizeUrl(previewFile.url)}
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
                handleDownloadFile(previewFile);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dependent Person Modal */}
      <Dialog open={isDependentPersonModalOpen} onOpenChange={setIsDependentPersonModalOpen}>
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
              // Mevcut Bağlı Kişiler Listesi
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

                {/* Connected Dependents List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {connectedDependents.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Henüz bağlı kişi yok
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Bu kişiyle ilişkili herhangi bir kayıt bulunmuyor. Yeni kişi ekleyebilir
                        veya mevcut kayıtlardan birini bağlayabilirsiniz.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setModalMode('create');
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Yeni Kişi Ekle
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setModalMode('select');
                            loadExistingDependents();
                          }}
                        >
                          Mevcut Kişi Bağla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    connectedDependents.map((person) => (
                      <div
                        key={person.id}
                        className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {person.ad_soyad}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={
                                      person.tur?.includes('Bakmakla Yükümlü')
                                        ? 'default'
                                        : 'secondary'
                                    }
                                    className={
                                      person.tur?.includes('Bakmakla Yükümlü')
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }
                                  >
                                    {person.tur}
                                  </Badge>
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    {person.yakinlik}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                              <div>
                                <p className="text-gray-500 text-xs">TC Kimlik No</p>
                                <p className="font-medium">{person.kimlik_no}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Telefon</p>
                                <p className="font-medium">{person.telefon_no}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Bağlantı Tarihi</p>
                                <p className="font-medium">{person.baglanti_tarihi}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              Detay
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() =>
                                handleRemoveConnection(
                                  person.relationship_id ?? '',
                                  person.ad_soyad ?? '',
                                )
                              }
                            >
                              <X className="w-3 h-3 mr-1" />
                              Bağlantıyı Kaldır
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : modalMode === 'create' ? (
              // Yeni Kişi Ekleme Formu
              <>
                {/* Name and Surname */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dependent-name" className="text-sm font-medium">
                      Ad *
                    </Label>
                    <Input
                      id="dependent-name"
                      placeholder="Adını giriniz"
                      value={dependentPersonData.name}
                      onChange={(e) => {
                        setDependentPersonData((prev) => ({ ...prev, name: e.target.value }));
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependent-surname" className="text-sm font-medium">
                      Soyad *
                    </Label>
                    <Input
                      id="dependent-surname"
                      placeholder="Soyadını giriniz"
                      value={dependentPersonData.surname}
                      onChange={(e) => {
                        setDependentPersonData((prev) => ({ ...prev, surname: e.target.value }));
                      }}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* TC Kimlik No */}
                <div className="space-y-2">
                  <Label htmlFor="dependent-id" className="text-sm font-medium">
                    TC Kimlik No *
                  </Label>
                  <Input
                    id="dependent-id"
                    placeholder="11 haneli TC kimlik numarası"
                    value={dependentPersonData.id_number}
                    onChange={(e) => {
                      setDependentPersonData((prev) => ({ ...prev, id_number: e.target.value }));
                    }}
                    className="h-10"
                    maxLength={11}
                  />
                </div>

                {/* Phone and Relationship */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dependent-phone" className="text-sm font-medium">
                      Telefon
                    </Label>
                    <Input
                      id="dependent-phone"
                      placeholder="05XX XXX XX XX"
                      value={dependentPersonData.phone}
                      onChange={(e) => {
                        setDependentPersonData((prev) => ({ ...prev, phone: e.target.value }));
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependent-relationship" className="text-sm font-medium">
                      Yakınlık Derecesi *
                    </Label>
                    <Select
                      value={dependentPersonData.relationship}
                      onValueChange={(value: any) => {
                        setDependentPersonData((prev) => ({ ...prev, relationship: value }));
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anne">Anne</SelectItem>
                        <SelectItem value="baba">Baba</SelectItem>
                        <SelectItem value="es">Eş</SelectItem>
                        <SelectItem value="cocuk">Çocuk</SelectItem>
                        <SelectItem value="kardes">Kardeş</SelectItem>
                        <SelectItem value="diger">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Birth Date and Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dependent-birth-date" className="text-sm font-medium">
                      Doğum Tarihi
                    </Label>
                    <Input
                      id="dependent-birth-date"
                      type="date"
                      value={dependentPersonData.birth_date}
                      onChange={(e) => {
                        setDependentPersonData((prev) => ({ ...prev, birth_date: e.target.value }));
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependent-gender" className="text-sm font-medium">
                      Cinsiyet
                    </Label>
                    <Select
                      value={dependentPersonData.gender}
                      onValueChange={(value: any) => {
                        setDependentPersonData((prev) => ({ ...prev, gender: value }));
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="erkek">Erkek</SelectItem>
                        <SelectItem value="kadin">Kadın</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="dependent-address" className="text-sm font-medium">
                    Adres
                  </Label>
                  <Textarea
                    id="dependent-address"
                    placeholder="Adres bilgilerini giriniz (opsiyonel)"
                    value={dependentPersonData.address}
                    onChange={(e) => {
                      setDependentPersonData((prev) => ({ ...prev, address: e.target.value }));
                    }}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </>
            ) : (
              // Mevcut Kişi Seçimi
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Sistemde kayıtlı kişilerden birini seçerek bu kişiyle ilişkilendirebilirsiniz.
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Ad, soyad, TC, telefon, şehir veya uyruk ile ara..."
                    value={dependentSearchTerm}
                    onChange={(e) => {
                      setDependentSearchTerm(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Existing Dependents List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoadingDependents ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p className="text-sm text-gray-600">Kayıtlar yükleniyor...</p>
                    </div>
                  ) : filteredDependents.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {dependentSearchTerm
                          ? 'Arama kriterlerine uygun kişi bulunamadı'
                          : 'Henüz kayıtlı kişi bulunmuyor'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setModalMode('create');
                        }}
                      >
                        Yeni Kişi Ekle
                      </Button>
                    </div>
                  ) : (
                    filteredDependents.map((person) => (
                      <div
                        key={person.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedDependentId === person.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedDependentId(person.id);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{person.ad_soyad}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      person.tur?.includes('Bakmakla Yükümlü')
                                        ? 'default'
                                        : 'secondary'
                                    }
                                    className={
                                      person.tur?.includes('Bakmakla Yükümlü')
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }
                                  >
                                    {person.tur ?? person.Tur ?? 'İhtiyaç Sahibi'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500">TC Kimlik No</p>
                                <p className="font-medium text-xs">
                                  {person.kimlik_no ?? person.Kimlik_No ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Telefon</p>
                                <p className="font-medium text-xs">
                                  {person.telefon_no ?? person.Telefon_No ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Şehir</p>
                                <p className="font-medium text-xs">{person.sehri ?? '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Uyruk</p>
                                <p className="font-medium text-xs">
                                  {person.uyruk ?? person.Uyruk ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Kategori</p>
                                <p className="font-medium text-xs">
                                  {person.kategori ?? person.Kategori ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">ID</p>
                                <Badge variant="outline" className="text-xs">
                                  #{person.id}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {selectedDependentId === person.id && (
                            <div className="ml-4">
                              <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Relationship Selection for Existing Person */}
                {selectedDependentId && (
                  <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                    <Label className="text-sm font-medium">Bu kişiyle yakınlık dereceniz *</Label>
                    <Select
                      value={selectedRelationshipType}
                      onValueChange={setSelectedRelationshipType}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Yakınlık derecesi seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Anne/Baba</SelectItem>
                        <SelectItem value="spouse">Eş</SelectItem>
                        <SelectItem value="child">Çocuk</SelectItem>
                        <SelectItem value="sibling">Kardeş</SelectItem>
                        <SelectItem value="grandparent">Büyükanne/Büyükbaba</SelectItem>
                        <SelectItem value="grandchild">Torun</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseDependentPersonModal}
              disabled={isSavingDependent}
              className="px-6"
            >
              İptal
            </Button>

            {modalMode === 'list' ? null : modalMode === 'create' ? ( // Liste modunda sadece kapat butonu
              <>
                <Button
                  variant="secondary"
                  onClick={handleSaveDependent}
                  disabled={isSavingDependent}
                  className="px-6"
                >
                  {isSavingDependent ? 'Kaydediliyor...' : 'Sadece Kaydet'}
                </Button>
                <Button
                  onClick={handleSaveAndGoToDetail}
                  disabled={isSavingDependent}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingDependent ? 'Kaydediliyor...' : 'Kaydet ve Detaya Git'}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLinkExistingPerson}
                disabled={(!selectedDependentId || !selectedRelationshipType) ?? isSavingDependent}
                className="px-6 bg-green-600 hover:bg-green-700"
              >
                {isSavingDependent ? 'Bağlanıyor...' : 'Kişiyi Bağla'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photos Modal */}
      <Dialog open={isPhotosModalOpen} onOpenChange={setIsPhotosModalOpen}>
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
                <h3 className="text-lg font-medium">Fotoğraflar ({photos?.length ?? 0})</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Grid className="w-4 h-4 mr-2" />
                    Izgara
                  </Button>
                </div>
              </div>

              {photos?.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz fotoğraf yüklenmemiş</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {photos?.map((photo) => (
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
            <Button variant="outline" onClick={handleClosePhotosModal}>
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

      {/* Donors Modal */}
      <Dialog open={isDonorsModalOpen} onOpenChange={setIsDonorsModalOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Bağışçılar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Search and Filter Section */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Bağışçı ara (isim, email)..."
                  value={donorSearchTerm}
                  onChange={(e) => {
                    setDonorSearchTerm(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrele
              </Button>
            </div>

            {/* Donors Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                  <div>Bağışçı</div>
                  <div>İletişim</div>
                  <div>Toplam Bağış</div>
                  <div>Son Bağış</div>
                  <div>Bağış Sayısı</div>
                  <div>İşlemler</div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredDonors?.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {donorSearchTerm
                        ? 'Arama kriterlerine uygun bağışçı bulunamadı'
                        : 'Henüz bağışçı kaydı bulunmuyor'}
                    </p>
                  </div>
                ) : (
                  filteredDonors?.map((donor) => (
                    <div
                      key={donor.id}
                      className="px-6 py-4 border-b hover:bg-gray-50 transition-colors"
                    >
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div>
                          <p className="font-medium text-gray-900">{donor.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{donor.email}</p>
                          <p className="text-sm text-gray-500">{donor.phone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-green-600">{donor.totalDonation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{donor.lastDonation}</p>
                        </div>
                        <div>
                          <Badge variant="secondary">{donor.donationCount} bağış</Badge>
                        </div>
                        <div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              Detay
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{donors.length}</p>
                  <p className="text-sm text-gray-600">Toplam Bağışçı</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {donors
                      .reduce(
                        (sum, donor) => sum + parseInt(donor.totalDonation.replace(/[^0-9]/g, '')),
                        0,
                      )
                      .toLocaleString('tr-TR')}{' '}
                    TL
                  </p>
                  <p className="text-sm text-gray-600">Toplam Bağış</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {donors.reduce((sum, donor) => sum + donor.donationCount, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Toplam Bağış Sayısı</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDonorsModal}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sponsors Modal */}
      <Dialog open={isSponsorsModalOpen} onOpenChange={setIsSponsorsModalOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sponsorlar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sponsors Cards */}
            <div className="space-y-4">
              {sponsors.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz sponsor kaydı bulunmuyor</p>
                </div>
              ) : (
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {sponsors?.map((sponsor) => (
                    <Card key={sponsor.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {sponsor.name}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {sponsor.type}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">İletişim</p>
                                <p className="text-sm font-medium">{sponsor.contact}</p>
                                <p className="text-sm text-gray-600">{sponsor.phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Sponsorluk Miktarı</p>
                                <p className="text-lg font-bold text-green-600">
                                  {sponsor.sponsorshipAmount}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Başlangıç</p>
                                <p className="text-sm font-medium">{sponsor.startDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Bitiş</p>
                                <p className="text-sm font-medium">{sponsor.endDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Durum</p>
                                <Badge
                                  variant={sponsor.status === 'Aktif' ? 'default' : 'secondary'}
                                  className={
                                    sponsor.status === 'Aktif' ? 'bg-green-100 text-green-800' : ''
                                  }
                                >
                                  {sponsor.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              Detay
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit3 className="w-3 h-3 mr-1" />
                              Düzenle
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {sponsors.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{sponsors.length}</p>
                    <p className="text-sm text-gray-600">Toplam Sponsor</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {sponsors.filter((s) => s.status === 'Aktif').length}
                    </p>
                    <p className="text-sm text-gray-600">Aktif Sponsor</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {sponsors
                        .reduce(
                          (sum, sponsor) =>
                            sum + parseInt(sponsor.sponsorshipAmount.replace(/[^0-9]/g, '')),
                          0,
                        )
                        .toLocaleString('tr-TR')}{' '}
                      TL
                    </p>
                    <p className="text-sm text-gray-600">Toplam Sponsorluk</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseSponsorsModal}>
              Kapat
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Shield className="w-4 h-4 mr-2" />
              Yeni Sponsor Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Requests Modal */}
      <Dialog open={isHelpRequestsModalOpen} onOpenChange={setIsHelpRequestsModalOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Yardım Talepleri
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Help Requests List */}
            <div className="space-y-4">
              {helpRequests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz yardım talebi bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {helpRequests?.map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{request.title}</h3>
                                <p className="text-sm text-gray-600">{request.description}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Durum</p>
                                <Badge
                                  variant={
                                    request.status === 'Tamamlandı' ? 'default' : 'secondary'
                                  }
                                  className={
                                    request.status === 'Tamamlandı'
                                      ? 'bg-green-100 text-green-800'
                                      : request.status === 'Beklemede'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {request.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Tarih</p>
                                <p className="text-sm font-medium">{request.requestDate}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Öncelik</p>
                                <Badge
                                  variant="outline"
                                  className={
                                    request.priority === 'Yüksek'
                                      ? 'border-red-200 text-red-700'
                                      : request.priority === 'Orta'
                                        ? 'border-yellow-200 text-yellow-700'
                                        : 'border-green-200 text-green-700'
                                  }
                                >
                                  {request.priority}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Kategori</p>
                                <Badge variant="outline" className="text-xs">
                                  {request.category}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              Detay
                            </Button>
                            {request.status === 'Beklemede' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Tamamla
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {helpRequests.length > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{helpRequests.length}</p>
                    <p className="text-sm text-gray-600">Toplam Talep</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {helpRequests.filter((r) => r.status === 'Beklemede').length}
                    </p>
                    <p className="text-sm text-gray-600">Beklemede</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {helpRequests.filter((r) => r.status === 'Tamamlandı').length}
                    </p>
                    <p className="text-sm text-gray-600">Tamamlandı</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {helpRequests.filter((r) => r.priority === 'Yüksek').length}
                    </p>
                    <p className="text-sm text-gray-600">Yüksek Öncelik</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseHelpRequestsModal}>
              Kapat
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Yeni Talep Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completed Aids Modal */}
      <Dialog open={isCompletedAidsModalOpen} onOpenChange={setIsCompletedAidsModalOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Yapılan Yardımlar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Completed Aids List */}
            <div className="space-y-4">
              {completedAids.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz yapılan yardım bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {completedAids?.map((aid) => (
                    <Card key={aid.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Heart className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{aid.description}</h3>
                                <p className="text-sm text-gray-600">
                                  {aid.type} yardımı - {aid.provider}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Tarih</p>
                                <p className="text-sm font-medium">{aid.date}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Miktar</p>
                                <p className="text-sm font-medium text-green-600">{aid.amount}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Tür</p>
                                <Badge
                                  variant="outline"
                                  className={
                                    aid.type === 'Nakdi'
                                      ? 'border-green-200 text-green-700'
                                      : aid.type === 'Ayni'
                                        ? 'border-blue-200 text-blue-700'
                                        : 'border-purple-200 text-purple-700'
                                  }
                                >
                                  {aid.type}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Kaynak</p>
                                <p className="text-sm font-medium">{aid.provider}</p>
                              </div>
                            </div>

                            {aid.notes && (
                              <div className="mt-3 p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-500 mb-1">Notes</p>
                                <p className="text-sm text-gray-700">{aid.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              Detay
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" />
                              Rapor
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {completedAids.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{completedAids.length}</p>
                    <p className="text-sm text-gray-600">Toplam Yardım</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {completedAids.filter((a) => a.type === 'Nakdi').length}
                    </p>
                    <p className="text-sm text-gray-600">Nakdi Yardım</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {completedAids.filter((a) => a.type === 'Ayni').length}
                    </p>
                    <p className="text-sm text-gray-600">Ayni Yardım</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {completedAids.filter((a) => a.type === 'Hizmet').length}
                    </p>
                    <p className="text-sm text-gray-600">Hizmet</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseCompletedAidsModal}>
              Kapat
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Heart className="w-4 h-4 mr-2" />
              Yeni Yardım Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consent Declarations Modal */}
      <Dialog
        open={isConsentDeclarationsModalOpen}
        onOpenChange={setIsConsentDeclarationsModalOpen}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Rıza Beyanları
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Consent Declarations List */}
            <div className="space-y-4">
              {consentDeclarations.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz rıza beyanı bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {consentDeclarations?.map((consent) => (
                    <Card key={consent.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  consent.status === 'Onaylandı'
                                    ? 'bg-green-100'
                                    : consent.status === 'Beklemede'
                                      ? 'bg-yellow-100'
                                      : 'bg-red-100'
                                }`}
                              >
                                <Shield
                                  className={`w-5 h-5 ${
                                    consent.status === 'Onaylandı'
                                      ? 'text-green-600'
                                      : consent.status === 'Beklemede'
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                  }`}
                                />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{consent.title}</h3>
                                <p className="text-sm text-gray-600">{consent.description}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Durum</p>
                                <Badge
                                  variant={consent.status === 'Onaylandı' ? 'default' : 'secondary'}
                                  className={
                                    consent.status === 'Onaylandı'
                                      ? 'bg-green-100 text-green-800'
                                      : consent.status === 'Beklemede'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }
                                >
                                  {consent.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Tarih</p>
                                <p className="text-sm font-medium">{consent.date}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Kategori</p>
                                <Badge variant="outline" className="text-xs">
                                  {consent.type}
                                </Badge>
                              </div>
                            </div>
                            {consent.details && (
                              <div className="mt-3 p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-500 mb-1">Detaylar</p>
                                <p className="text-sm text-gray-700">{consent.details}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              Görüntüle
                            </Button>
                            {consent.status === 'Beklemede' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Onayla
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" />
                              İndir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {consentDeclarations.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{consentDeclarations.length}</p>
                    <p className="text-sm text-gray-600">Toplam Beyan</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {consentDeclarations.filter((c) => c.status === 'Onaylandı').length}
                    </p>
                    <p className="text-sm text-gray-600">Onaylandı</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {consentDeclarations.filter((c) => c.status === 'Beklemede').length}
                    </p>
                    <p className="text-sm text-gray-600">Beklemede</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {consentDeclarations.filter((c) => c.status === 'Reddedildi').length}
                    </p>
                    <p className="text-sm text-gray-600">Reddedildi</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseConsentDeclarationsModal}>
              Kapat
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Shield className="w-4 h-4 mr-2" />
              Yeni Beyan Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BeneficiaryDetailPageComprehensive;
