/**
 * @fileoverview BeneficiariesPageEnhanced Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Loader2,
  Search,
  TrendingUp,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
// Note: useSupabaseAuth removed as authentication is handled at app level
import {
  ihtiyacSahipleriService,
  type IhtiyacSahibi,
} from '../../services/ihtiyacSahipleriService';
import { PageLoading } from '../LoadingSpinner';
// OCR Scanner removed
import { PageLayout } from '../PageLayout';
import { NewCategoryNotification } from '../notifications/NewCategoryNotification';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

import { logger } from '../../lib/logging/logger';
// İhtiyaç sahipleri için display tipi
interface IhtiyacSahibiDisplay extends IhtiyacSahibi {
  display_id?: number; // 1'den başlayan sıralı ID
  formatted_phone?: string;
  formatted_registration_date?: string;
  status?: 'active' | 'passive' | 'suspended' | 'under_evaluation';
  priority_level?: 'low' | 'medium' | 'high';
}

// Status mapping for beneficiaries - Using Badge variants
const statusMapping = {
  active: {
    label: 'Aktif',
    key: 'active',
    variant: 'success' as const,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  inactive: {
    label: 'Pasif',
    key: 'inactive',
    variant: 'destructive' as const,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  passive: { 
    label: 'Pasif', 
    key: 'passive', 
    variant: 'destructive' as const,
    className: 'bg-red-50 text-red-700 border-red-200' 
  },
  suspended: {
    label: 'Askıda',
    key: 'suspended',
    variant: 'warning' as const,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  under_evaluation: {
    label: 'Değerlendirmede',
    key: 'under_evaluation',
    variant: 'info' as const,
    className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  archived: {
    label: 'Arşivlendi',
    key: 'archived',
    variant: 'outline' as const,
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  },
} as const;

// Category mapping for beneficiaries - Corporate colors
const categoryMapping = {
  gıda: { label: 'Gıda Yardımı', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  nakdi: { label: 'Nakdi Yardım', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  eğitim: { label: 'Eğitim Desteği', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  sağlık: { label: 'Sağlık Yardımı', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  barınma: { label: 'Barınma Desteği', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  giyim: { label: 'Giyim Yardımı', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  diğer: { label: 'Diğer Yardım', color: 'bg-gray-50 text-gray-700 border-gray-200' },
} as const;

// Aid type mapping removed - not used in current implementation

interface BeneficiariesPageProps {
  onNavigateToDetail?: (beneficiaryId: string) => void;
}

/**
 * BeneficiariesPageEnhanced function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function BeneficiariesPageEnhanced({ onNavigateToDetail }: BeneficiariesPageProps) {
  // Note: Authentication is handled at the app level, no need to check here
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Note: statusFilter removed as status field doesn't exist in database
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [beneficiaries, setBeneficiaries] = useState<IhtiyacSahibiDisplay[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // OCR Scanner removed
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    passive: 0,
    suspended: 0,
    underEvaluation: 0,
    totalAidAmount: 0,
    bakimYukumluCount: 0,
  });
  const [newBeneficiary, setNewBeneficiary] = useState<{
    ad_soyad: string;
    kimlik_no: string;
    telefon_no: string;
    sehri: string;
    uyruk: string;
    ulkesi: string;
    adres: string;
    kategori: string;
    tur: string;
    iban: string;
  }>({
    ad_soyad: '',
    kimlik_no: '',
    telefon_no: '',
    sehri: '',
    uyruk: '',
    ulkesi: '',
    adres: '',
    kategori: '',
    tur: '',
    iban: '',
  });

  // Load beneficiaries data with enhanced error handling
  const loadBeneficiaries = useCallback(async () => {
    try {
      setLoading(true);

      const filters = {
        // Note: status filter removed as status field doesn't exist in database
        city: cityFilter !== 'all' ? cityFilter : undefined,
        // Note: category filter removed as it's not in the database schema
        searchTerm: searchTerm.trim() ?? undefined,
      };

      const result = await ihtiyacSahipleriService.getIhtiyacSahipleri(currentPage, pageSize, {
        searchTerm: filters.searchTerm,
        sehir: filters.city,
        sortBy,
      });

      if (result.error) {
        logger.error('❌ Service returned error:', result.error);
        setBeneficiaries([]);
        setTotalCount(0);
        return;
      }

      // Transform data to include display fields with proper fallbacks
      const transformedData = (result.data || []).map((item: IhtiyacSahibi) => ({
        ...item,
        // Migration sonrası gerçek ID'ler 1'den başlayacak, display_id gerekli değil
        display_id: item.id, // Gerçek ID'yi kullan
        
        // Phone formatting with multiple fallbacks
        formatted_phone: item.telefon_no ?? item.Telefon_No ?? 'Telefon bilgisi yok',
        
        // Registration date with proper formatting
        formatted_registration_date: item.kayit_tarihi ?? item.Kayit_Tarihi ?? new Date().toISOString().split('T')[0],
        
        // Name with fallback
        ad_soyad: item.ad_soyad ?? 'Ad Soyad bilgisi yok',
        
        // Identity number with fallback
        kimlik_no: item.kimlik_no ?? item.Kimlik_No ?? 'TC No bilgisi yok',
        
        // City with fallback
        sehri: item.sehri ?? 'Şehir bilgisi yok',
        
        // Address with fallback
        adres: item.adres ?? item.Adres ?? 'Adres bilgisi yok',
        
        // Category and type with fallbacks
        kategori: item.kategori ?? item.Kategori ?? 'Kategori belirtilmemiş',
        tur: item.tur ?? item.Tur ?? 'Tür belirtilmemiş',
        
        // IBAN with fallback
        iban: item.iban ?? 'IBAN bilgisi yok',
        
        // Status and priority with defaults
        status: (item.status as any) ?? 'active' as const,
        priority_level: 'medium' as const,
      }));

      setBeneficiaries(transformedData);
      setTotalCount(result.count ?? 0);
    } catch (error) {
      logger.error('Error loading beneficiaries:', error);
      setBeneficiaries([]);
      setTotalCount(0);

      if (error instanceof Error) {
        const errorMessage = error.message ?? 'Database hatası';

        if (error.message.includes('JWT expired')) {
          toast.error('Oturum süresi doldu. Lütfen bekleyin, sayfa yenileniyor...', {
            duration: 3000,
          });
        } else if (error.message.includes('does not exist') || !error.message) {
          toast.info('Database henüz hazırlanıyor', {
            description: 'Tablolar oluşturulduğunda veriler görünecektir',
            duration: 4000,
          });
        } else if (error.message.includes('permission denied')) {
          toast.error('Bu işlem için yetkiniz bulunmuyor', {
            duration: 4000,
          });
        } else {
          toast.error('İhtiyaç sahipleri yüklenirken hata oluştu', {
            description: errorMessage,
            duration: 5000,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, cityFilter, searchTerm, sortBy]);

  // Load stats computed from already loaded beneficiaries to avoid extra network calls
  const loadStats = useCallback(async () => {
    try {
      const data = Array.isArray(beneficiaries) ? beneficiaries : [];

      const bakimYukumluCount = data
        .map((item) => (item.tur || '').toString())
        .filter(
          (key) =>
            key.toLowerCase().includes('bakmakla') || key.toLowerCase().includes('yükümlü'),
        ).length;

      setStats({
        total: data.length,
        active: data.length, // Varsayılan: hepsi aktif
        passive: 0,
        suspended: 0,
        underEvaluation: 0,
        totalAidAmount: 0, // Bu veri tabloda yok
        bakimYukumluCount,
      });
    } catch (error) {
      logger.error('Stats loading failed:', error);
      setStats({
        total: 0,
        active: 0,
        passive: 0,
        suspended: 0,
        underEvaluation: 0,
        totalAidAmount: 0,
        bakimYukumluCount: 0,
      });
    }
  }, [beneficiaries]);

  // Load cities for filter
  const loadCities = useCallback(async () => {
    try {
      const result = await ihtiyacSahipleriService.getSehirler();
      if (result.data) {
        setCities(result.data);
      }
    } catch {
      // Error loading cities - handle gracefully
    }
  }, []);

  // Test Supabase connection first
  useEffect(() => {
    const testConnection = async () => {
      const result = await ihtiyacSahipleriService.testConnection();
      logger.info('🔗 Connection test result:', result);
    };
    testConnection();
  }, []);

  // Initial load
  useEffect(() => {
    loadBeneficiaries();
    loadCities();
  }, [loadBeneficiaries, loadCities]);

  // Load stats after beneficiaries are loaded
  useEffect(() => {
    if (beneficiaries.length > 0) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiaries.length]);

  // Reload on filter changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadBeneficiaries();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, cityFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    const statusInfo =
      statusMapping[status as keyof typeof statusMapping] || statusMapping.inactive;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryInfo = categoryMapping[category as keyof typeof categoryMapping];
    const categoryLabel = categoryInfo?.label ?? category;
    const isNewCategory = category === 'Bakmakla Yükümlü Olunan Kişi';

    return (
      <Badge
        variant={isNewCategory ? 'default' : 'outline'}
        className={
          isNewCategory
            ? 'bg-purple-100 text-purple-800 border-purple-200'
            : categoryInfo?.color ?? ''
        }
      >
        {categoryInfo?.icon && `${categoryInfo.icon} `}
        {categoryLabel}
      </Badge>
    );
  };

  const handleCreateBeneficiary = async () => {
    // Authentication check
    if (!isAuthenticated || !user?.id) {
      toast.error('Lütfen önce giriş yapın');
      return;
    }

    // Form validation
    if (!newBeneficiary.ad_soyad.trim()) {
      toast.error('Ad soyad zorunludur');
      return;
    }

    try {
      setSaving(true);

      const ihtiyacSahibiData = {
        ad_soyad: newBeneficiary.ad_soyad.trim(),
        kimlik_no: newBeneficiary.kimlik_no.trim() ?? null,
        telefon_no: newBeneficiary.telefon_no.trim() ?? null,
        sehri: newBeneficiary.sehri?.trim() ?? null,
        uyruk: newBeneficiary.uyruk?.trim() ?? null,
        ulkesi: newBeneficiary.ulkesi?.trim() ?? null,
        adres: newBeneficiary.adres.trim() ?? null,
        kategori: newBeneficiary.kategori?.trim() ?? null,
        tur: newBeneficiary.tur?.trim() ?? null,
        iban: newBeneficiary.iban?.trim() ?? null,
      };

      const { data, error } = await ihtiyacSahipleriService.createIhtiyacSahibi(ihtiyacSahibiData);

      if (error || !data) {
        throw new Error(error ?? 'Kayıt oluşturulamadı');
      }

      toast.success(`${data.ad_soyad} başarıyla kaydedildi!`, {
        description: 'Liste yenileniyor...',
        duration: 2000,
      });

      // Close modal first
      setShowCreateModal(false);

      // Reset form
      setNewBeneficiary({
        ad_soyad: '',
        kimlik_no: '',
        telefon_no: '',
        sehri: '',
        uyruk: '',
        ulkesi: '',
        adres: '',
        kategori: '',
        tur: '',
        iban: '',
      });

      // Navigate to detail page immediately after successful save
      if (onNavigateToDetail && data.id) {
        onNavigateToDetail(String(data.id));
      }

      // Reload data in background
      await loadBeneficiaries();
      await loadStats();
    } catch (error) {
      logger.error('❌ Error creating beneficiary:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Export function
  const handleExport = async () => {
    try {
      // Create CSV data
      const headers = [
        'Ad Soyad',
        'Kimlik No',
        'Telefon',
        'Şehir',
        'Uyruk',
        'Ülke',
        'Adres',
        'Kategori',
        'Tür',
        'IBAN',
        'Durum',
        'Kayıt Tarihi'
      ];
      
      const csvData = beneficiaries.map(beneficiary => [
        beneficiary.ad_soyad,
        beneficiary.kimlik_no,
        beneficiary.telefon_no,
        beneficiary.sehri,
        beneficiary.uyruk,
        beneficiary.ulkesi,
        beneficiary.adres,
        beneficiary.kategori,
        beneficiary.tur,
        beneficiary.iban,
        beneficiary.durum,
        new Date(beneficiary.created_at).toLocaleDateString('tr-TR')
      ]);

      const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ihtiyac_sahipleri_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('Veriler başarıyla dışa aktarıldı');
    } catch (error) {
      toast.error('Dışa aktarma sırasında bir hata oluştu');
      console.error('Export error:', error);
    }
  };

  // Delete beneficiary function
  const handleDeleteBeneficiary = useCallback(async (beneficiaryId: string) => {
    try {
      setSaving(true);
      const result = await ihtiyacSahipleriService.deleteIhtiyacSahibi(beneficiaryId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setBeneficiaries(prev => prev.filter(b => String(b.id) !== beneficiaryId));
      toast.success('İhtiyaç sahibi başarıyla silindi');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme işlemi sırasında bir hata oluştu');
    } finally {
      setSaving(false);
    }
  }, []);

  // OCR Scanner removed

  if (loading && beneficiaries.length === 0) {
    return <PageLoading />;
  }

  return (
    <>
      <PageLayout
        title="İhtiyaç Sahipleri"
        subtitle="Dernek yardımlarından faydalanan kişileri yönetin"
        className="min-h-screen"
        actions={
          <div className="flex gap-3 flex-wrap items-center justify-end w-full sm:w-auto p-2 sm:p-0">
            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] min-w-[44px] px-3 border-gray-300 hover:border-gray-400 order-2 sm:order-1 sm:px-4 professional-card hover:shadow-md transition-shadow"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Dışa Aktar</span>
              <span className="sm:hidden">Dışa Aktar</span>
            </Button>

            {/* Primary Add Button - Enhanced */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="min-h-[44px] min-w-[44px] px-3 py-3 corporate-gradient text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 order-1 sm:order-2 flex-shrink-0 micro-interaction sm:px-6"
                  type="button"
                  data-testid="new-beneficiary-btn"
                  aria-label="Yeni İhtiyaç Sahibi Ekle"
                >
                  <UserPlus className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">
                    Yeni İhtiyaç Sahibi Ekle
                  </span>
                  <span className="sm:hidden">Yeni Ekle</span>
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto professional-card"
                aria-describedby="dialog-description"
              >
                <DialogHeader className="pb-4">
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-primary" />
                    Yeni İhtiyaç Sahibi Kaydı
                  </DialogTitle>
                  <DialogDescription id="dialog-description" className="text-muted-foreground mt-1">
                    İhtiyaç sahibi kişinin bilgilerini dernek çalışanı olarak sisteme kaydedin. Tüm
                    zorunlu alanları (*) doldurmanız gereklidir.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ad_soyad">Ad Soyad *</Label>
                    <Input
                      id="ad_soyad"
                      value={newBeneficiary.ad_soyad}
                      onChange={(e) => {
                        setNewBeneficiary({ ...newBeneficiary, ad_soyad: e.target.value });
                      }}
                      placeholder="İhtiyaç sahibinin tam adını giriniz"
                      className="min-h-[44px] focus-corporate"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="kimlik_no">Kimlik No</Label>
                      {/* OCR Scanner removed */}
                    </div>
                    <Input
                      id="kimlik_no"
                      value={newBeneficiary.kimlik_no}
                      onChange={(e) => {
                        setNewBeneficiary({ ...newBeneficiary, kimlik_no: e.target.value });
                      }}
                      placeholder="Kimlik numarası (TC, Pasaport vb.)"
                      className="min-h-[44px] focus-corporate"
                      disabled={saving}
                    />
                    {/* OCR Scanner help text removed */}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefon_no">Telefon</Label>
                    <Input
                      id="telefon_no"
                      type="tel"
                      value={newBeneficiary.telefon_no}
                      onChange={(e) => {
                        setNewBeneficiary({ ...newBeneficiary, telefon_no: e.target.value });
                      }}
                      placeholder="İhtiyaç sahibinin telefon numarası"
                      className="min-h-[44px] focus-corporate"
                      inputMode="tel"
                      disabled={saving}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sehri">Şehir</Label>
                      <Input
                        id="sehri"
                        value={newBeneficiary.sehri}
                        onChange={(e) => {
                          setNewBeneficiary({ ...newBeneficiary, sehri: e.target.value });
                        }}
                        placeholder="İhtiyaç sahibinin yaşadığı şehir"
                        className="min-h-[44px] focus-corporate"
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uyruk">Uyruk</Label>
                      <Input
                        id="uyruk"
                        value={newBeneficiary.uyruk}
                        onChange={(e) => {
                          setNewBeneficiary({ ...newBeneficiary, uyruk: e.target.value });
                        }}
                        placeholder="Uyruğu (ör: Türkiye, Suriye)"
                        className="min-h-[44px] focus-corporate"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adres">Adres</Label>
                    <Input
                      id="adres"
                      value={newBeneficiary.adres}
                      onChange={(e) => {
                        setNewBeneficiary({ ...newBeneficiary, adres: e.target.value });
                      }}
                      placeholder="İhtiyaç sahibinin adresi"
                      className="min-h-[44px] focus-corporate"
                      disabled={saving}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kategori">Kategori</Label>
                      <Input
                        id="kategori"
                        value={newBeneficiary.kategori}
                        onChange={(e) => {
                          setNewBeneficiary({ ...newBeneficiary, kategori: e.target.value });
                        }}
                        placeholder="Yardım kategorisi"
                        className="min-h-[44px] focus-corporate"
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tur">Tür</Label>
                      <Input
                        id="tur"
                        value={newBeneficiary.tur}
                        onChange={(e) => {
                          setNewBeneficiary({ ...newBeneficiary, tur: e.target.value });
                        }}
                        placeholder="İhtiyaç sahibi türü"
                        className="min-h-[44px] focus-corporate"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={newBeneficiary.iban}
                      onChange={(e) => {
                        setNewBeneficiary({ ...newBeneficiary, iban: e.target.value });
                      }}
                      placeholder="Banka IBAN numarası (isteğe bağlı)"
                      className="min-h-[44px] focus-corporate"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                    }}
                    className="min-h-[44px] px-6"
                    disabled={saving}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleCreateBeneficiary}
                    className="min-h-[44px] px-6 corporate-gradient shadow-md hover:shadow-lg"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Kaydet ve Devam Et
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <Card className="professional-card micro-interaction">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-2xl text-blue-600">{stats.total ?? 0}</div>
                    <p className="text-xs sm:text-sm text-gray-600">Toplam Kayıt</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="professional-card micro-interaction">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-2xl text-green-600">{stats.active ?? 0}</div>
                    <p className="text-xs sm:text-sm text-gray-600">Aktif</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="professional-card micro-interaction">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-2xl text-orange-600">
                      {stats.underEvaluation ?? 0}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Değerlendirmede</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="professional-card micro-interaction">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-2xl text-purple-600">
                      {stats.bakimYukumluCount ?? 0}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Bakmakla Yükümlü</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-purple-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="professional-card micro-interaction">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg sm:text-2xl text-emerald-600">
                      ₺{(stats.totalAidAmount ?? 0).toLocaleString()}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Toplam Yardım</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Table Card with Enhanced Design */}
          <Card className="professional-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                İhtiyaç Sahibi Listesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Enhanced Filters with Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Ad, soyad veya TC kimlik no ile ara..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    className="pl-10 min-h-[44px] focus-corporate text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:flex">
                  {/* Status filter removed as status field doesn't exist in database */}
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="min-w-[120px] min-h-[44px] focus-corporate text-sm sm:text-base">
                      <SelectValue placeholder="Tüm Şehirler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Şehirler</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="min-w-[140px] min-h-[44px] focus-corporate text-sm sm:text-base">
                      <SelectValue placeholder="Sıralama" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Ad (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Ad (Z-A)</SelectItem>
                      <SelectItem value="date-newest">En Yeni</SelectItem>
                      <SelectItem value="date-oldest">En Eski</SelectItem>
                      <SelectItem value="city-asc">Şehir (A-Z)</SelectItem>
                      <SelectItem value="category-asc">Kategori (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Enhanced Table - Original Structure Preserved */}
              <div className="overflow-x-auto -mx-3 sm:-mx-6">
                <div className="inline-block min-w-full align-middle">
                  <Table className="min-w-max text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="min-w-[50px] font-medium text-center text-xs sm:text-sm">#</TableHead>
                      <TableHead className="min-w-[100px] font-medium text-xs sm:text-sm">Tür</TableHead>
                      <TableHead className="min-w-[140px] font-medium text-xs sm:text-sm">İsim</TableHead>
                      <TableHead className="min-w-[120px] font-medium text-xs sm:text-sm">Kategori</TableHead>
                      <TableHead className="min-w-[50px] font-medium text-center text-xs sm:text-sm">Yaş</TableHead>
                      <TableHead className="min-w-[70px] font-medium text-xs sm:text-sm">Uyruk</TableHead>
                      <TableHead className="min-w-[110px] font-medium text-xs sm:text-sm">Kimlik No</TableHead>
                      <TableHead className="min-w-[110px] font-medium text-xs sm:text-sm">Cep Telefonu</TableHead>
                      <TableHead className="min-w-[70px] font-medium text-xs sm:text-sm">Ülke</TableHead>
                      <TableHead className="min-w-[110px] font-medium text-xs sm:text-sm">Şehir</TableHead>
                      <TableHead className="min-w-[90px] font-medium text-xs sm:text-sm">Yerleşim</TableHead>
                      <TableHead className="min-w-[150px] font-medium text-xs sm:text-sm">Adres</TableHead>
                      <TableHead className="min-w-[100px] font-medium text-xs sm:text-sm text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                          <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Henüz hiç ihtiyaç sahibi kaydı yok.</p>
                          <p className="text-sm text-gray-400 mt-1">
                            İlk kayıt için &quot;Yeni İhtiyaç Sahibi Ekle&quot; butonunu kullanın
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      beneficiaries.map((beneficiary) => (
                        <TableRow
                          key={beneficiary.id}
                          className="hover:bg-blue-50/30 transition-colors cursor-pointer border-b border-gray-100"
                          onClick={() => onNavigateToDetail?.(String(beneficiary.id))}
                        >
                          <TableCell className="py-1.5 px-2 text-center">
                            <div className="flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full min-w-[28px]">
                                {beneficiary.display_id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <div className="flex items-center gap-1.5">
                              <Search className="w-2.5 h-2.5 text-gray-400" />
                              <span
                                className="truncate max-w-[120px]"
                                title={beneficiary.tur ?? beneficiary.Tur ?? 'İhtiyaç Sahibi'}
                              >
                                {beneficiary.tur ?? beneficiary.Tur ?? 'İhtiyaç Sahibi'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <div className="flex flex-col">
                              <span className={`font-medium ${beneficiary.ad_soyad === 'Ad Soyad bilgisi yok' ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                                {beneficiary.ad_soyad}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            {getCategoryBadge(
                              beneficiary.kategori ?? beneficiary.Kategori ?? 'Genel',
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-center">-</TableCell>
                          <TableCell className="py-1.5 px-2">
                            {beneficiary.uyruk ?? beneficiary.Uyruk ?? 'TR'}
                          </TableCell>
                          <TableCell className="py-1.5 px-2 font-mono">
                            <span className={beneficiary.kimlik_no === 'TC No bilgisi yok' ? 'text-gray-400 italic' : ''}>
                              {beneficiary.kimlik_no ?? beneficiary.Kimlik_No ?? '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            {beneficiary.formatted_phone && beneficiary.formatted_phone !== 'Telefon bilgisi yok' ? (
                              <span className="text-blue-600">{beneficiary.formatted_phone}</span>
                            ) : (
                              <span className="text-gray-400 italic">Telefon bilgisi yok</span>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 px-2">{beneficiary.ulkesi ?? 'Türkiye'}</TableCell>
                          <TableCell className="py-1.5 px-2">
                            <span
                              className={`truncate max-w-[100px] ${beneficiary.sehri === 'Şehir bilgisi yok' ? 'text-gray-400 italic' : ''}`}
                              title={beneficiary.sehri ?? undefined}
                            >
                              {beneficiary.sehri ?? '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            {beneficiary.yerlesimi ?? beneficiary.Yerlesimi ?? '-'}
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <span
                              className={`truncate max-w-[150px] ${beneficiary.adres === 'Adres bilgisi yok' ? 'text-gray-400 italic' : ''}`}
                              title={beneficiary.adres ?? beneficiary.Adres ?? undefined}
                            >
                              {beneficiary.adres ?? beneficiary.Adres ?? '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-1.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBeneficiary(String(beneficiary.id));
                                }}
                                aria-label="İhtiyaç sahibini sil"
                                disabled={saving}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OCR Scanner removed */}
      </PageLayout>

      {/* New Category Notification */}
      <NewCategoryNotification />

      {/* OCR Scanner Modal removed */}
    </>
  );
}

export default BeneficiariesPageEnhanced;
