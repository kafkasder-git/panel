/**
 * @fileoverview MembersPage Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import {
  Clock,
  Download,
  Edit,
  Eye,
  Filter,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { membersService, type Member } from '../../services/membersService';
import { useDataExport } from '../../hooks/useDataExport';
import { PageLoading } from '../LoadingSpinner';
import { PageLayout } from '../PageLayout';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DesktopActionButtons, DesktopFilters, DesktopStatsCard } from '../ui/desktop-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ExportModal } from '../data/ExportModal';

import { logger } from '../../lib/logging/logger';
// Status and membership type mappings for Turkish display
const statusMapping = {
  active: 'Aktif',
  inactive: 'Pasif',
  suspended: 'Askıda',
} as const;

const membershipTypeMapping = {
  standard: 'Standart',
  premium: 'Premium',
  corporate: 'Kurumsal',
  student: 'Öğrenci',
  senior: 'Emekli',
} as const;

/**
 * MembersPage function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function MembersPage() {
  // User authentication handled by AuthContext
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showExportModal, setShowExportModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
  });

  // Dialog state for creating new member
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    membership_type: 'standard',
    membership_status: 'active',
    notes: '',
  });

  // TC020 FIX: Export functionality - removed direct export, now using ExportModal
  const { isExporting } = useDataExport();

  // Load members data
  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);

      const filters = {
        membershipStatus: statusFilter !== 'all' ? statusFilter : undefined,
        membershipType: typeFilter !== 'all' ? typeFilter : undefined,
        searchTerm: searchTerm.trim() ?? undefined,
      };

      const result = await membersService.getMembers(currentPage, pageSize, filters);

      if (result.error) {
        logger.error('❌ Error loading members:', result.error);
        setMembers([]);
        setTotalCount(0);
        toast.error('Üyeler yüklenirken hata oluştu');
        return;
      }

      setMembers(result.data || []);
      setTotalCount(result.count ?? 0);
    } catch (error) {
      logger.error('Error loading members:', error);
      toast.error('Üyeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, typeFilter, searchTerm]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const result = await membersService.getMemberStats();
      if (result.data) {
        setStats({
          total: result.data.total,
          active: result.data.active,
          inactive: result.data.inactive,
          suspended: result.data.suspended,
        });
      }
    } catch (error) {
      logger.error('Error loading stats:', error);
    }
  }, []);

  // Handle form submission for creating new member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.first_name || !formData.last_name) {
      toast.error('Ad ve soyad alanları zorunludur');
      return;
    }

    if (!formData.email || !formData.phone) {
      toast.error('E-posta ve telefon alanları zorunludur');
      return;
    }

    try {
      setIsSubmitting(true);

      // Map form fields to database schema
      const memberData = {
        name: formData.first_name,
        surname: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        membership_type: formData.membership_type,
        membership_status: formData.membership_status,
        notes: formData.notes,
      };

      const result = await membersService.createMember(memberData as any);

      if (result.error) {
        // TC008 FIX: Handle 409 conflict errors with user-friendly messages
        if (
          result.error.includes('duplicate') ||
          result.error.includes('unique') ||
          result.error.includes('already exists') ||
          result.error.includes('23505')
        ) {
          toast.error('Bu email veya telefon numarası zaten kayıtlı!', {
            description: 'Lütfen farklı bir email veya telefon numarası kullanın.',
            duration: 5000,
          });
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success('Üye başarıyla oluşturuldu!');
      setShowCreateDialog(false);

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        membership_type: 'standard',
        membership_status: 'active',
        notes: '',
      });

      // Reload members list
      await loadMembers();
      await loadStats();
    } catch (error) {
      logger.error('Error creating member:', error);
      toast.error('Üye oluşturulurken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // TC020 FIX: Export members handler
  // TC011 FIX: Export members handler - now opens modal instead of direct export
  const handleExportMembers = () => {
    setShowExportModal(true);
  };

  // Load cities for filter

  // Initial load
  useEffect(() => {
    loadMembers();
    loadStats();
  }, [loadMembers, loadStats]);

  // Reload on filter changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on filter change
      loadMembers();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    const displayStatus = statusMapping[status as keyof typeof statusMapping] || status;
    const variants = {
      Aktif: 'bg-green-100 text-green-800 hover:bg-green-100',
      Pasif: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      Askıda: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    };

    return <Badge className={variants[displayStatus]}>{displayStatus}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const displayType = membershipTypeMapping[type as keyof typeof membershipTypeMapping] || type;
    const variants = {
      Standart: 'bg-blue-100 text-blue-800',
      Premium: 'bg-purple-100 text-purple-800',
      Kurumsal: 'bg-orange-100 text-orange-800',
      Öğrenci: 'bg-emerald-100 text-emerald-800',
      Emekli: 'bg-indigo-100 text-indigo-800',
    };

    return (
      <Badge variant="secondary" className={variants[displayType]}>
        {displayType}
      </Badge>
    );
  };

  if (loading && members.length === 0) {
    return <PageLoading />;
  }

  return (
    <PageLayout
      title="Üye Yönetimi"
      subtitle="Dernek üyelerini görüntüleyin ve yönetin"
      actions={
        <DesktopActionButtons
          primaryAction={{
            label: 'Yeni Üye Ekle',
            icon: <Plus className="h-4 w-4" />,
            onClick: () => {
              setShowCreateDialog(true);
            },
          }}
          secondaryActions={[
            {
              label: isExporting ? 'Dışa aktarılıyor...' : 'Dışa Aktar',
              icon: <Download className="h-4 w-4" />,
              onClick: handleExportMembers,
              variant: 'outline',
            },
          ]}
        />
      }
    >
      <div className="space-y-6 p-6">
        {/* Desktop Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DesktopStatsCard
            title="Toplam Üye"
            value={stats.total}
            subtitle="Kayıtlı üye sayısı"
            icon={<Users className="h-4 w-4" />}
            color="blue"
            trend={{ value: '+%12 bu ay', positive: true }}
          />

          <DesktopStatsCard
            title="Aktif Üye"
            value={stats.active}
            subtitle="Aktif durumda"
            icon={<UserCheck className="h-4 w-4" />}
            color="green"
            trend={{
              value: `%${Math.round((stats.active / stats.total) * 100) || 0} aktif`,
              positive: true,
            }}
          />

          <DesktopStatsCard
            title="Pasif Üye"
            value={stats.inactive}
            subtitle="Pasif durumda"
            icon={<UserX className="h-4 w-4" />}
            color="gray"
            trend={{
              value: `%${Math.round((stats.inactive / stats.total) * 100) || 0} pasif`,
              positive: false,
            }}
          />

          <DesktopStatsCard
            title="Askıda"
            value={stats.suspended}
            subtitle="Askıya alınmış"
            icon={<Clock className="h-4 w-4" />}
            color="yellow"
            trend={{
              value: stats.suspended > 0 ? 'Dikkat gerekli' : 'Temiz durum',
              positive: stats.suspended === 0,
            }}
          />
        </div>

        {/* Mobile-Optimized Filters */}
        <DesktopFilters
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Dernek üyesi ara..."
        >
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-h-[44px] text-base">
              <SelectValue placeholder="Tüm Durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Pasif</SelectItem>
              <SelectItem value="suspended">Askıda</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="min-h-[44px] text-base">
              <SelectValue placeholder="Tüm Üyelik Tipleri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              <SelectItem value="standard">Standart</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="corporate">Kurumsal</SelectItem>
              <SelectItem value="student">Öğrenci</SelectItem>
              <SelectItem value="senior">Emekli</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="min-h-[44px] px-4 text-base">
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Gelişmiş Filtre</span>
            <span className="sm:hidden">Filtre</span>
          </Button>
        </DesktopFilters>

        {/* Mobile-Optimized Members List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">
              Üye Listesi ({(members || []).length} üye)
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Mobile Card View for small screens */}
            <div className="block sm:hidden">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                          <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : members.length > 0 ? (
                <div className="space-y-3 p-4">
                  {members.map((member) => (
                    <Card
                      key={member.id}
                      className="border border-gray-200 transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex flex-1 items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-corporate text-sm font-medium text-white">
                                {member.name.charAt(0)}
                                {member.surname?.charAt(0) || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-medium text-gray-900">
                                {member.name} {member.surname}
                              </h3>
                              <p className="truncate text-sm text-gray-600">{member.email}</p>
                              <p className="text-xs text-gray-500">
                                {member.phone ?? 'Telefon yok'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(member.membership_status)}
                            <div className="mt-1">{getTypeBadge(member.membership_type)}</div>
                          </div>
                        </div>

                        <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
                          <span>{member.city ?? 'Şehir belirtilmemiş'}</span>
                          <span>{new Date(member.join_date).toLocaleDateString('tr-TR')}</span>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[44px] min-w-[44px] p-2 text-blue-600 hover:text-blue-700"
                            onClick={() =>
                              toast.info(
                                `${member.name} ${member.surname} detayları görüntüleniyor`,
                              )
                            }
                            aria-label="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[44px] min-w-[44px] p-2 text-red-600 hover:text-red-700"
                            onClick={() => toast.error('Silme özelliği yakında eklenecek')}
                            aria-label="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="mb-2 text-gray-600">Henüz üye kaydı bulunmuyor</p>
                  <p className="text-sm text-gray-400">
                    Yeni üye eklemek için &quot;Yeni Üye&quot; butonunu kullanın
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="min-w-[200px] p-4">Üye</TableHead>
                    <TableHead className="min-w-[180px] p-4">E-posta</TableHead>
                    <TableHead className="min-w-[120px] p-4">Telefon</TableHead>
                    <TableHead className="min-w-[120px] p-4">Üyelik Tipi</TableHead>
                    <TableHead className="min-w-[100px] p-4">Durum</TableHead>
                    <TableHead className="min-w-[120px] p-4">Katılım Tarihi</TableHead>
                    <TableHead className="min-w-[120px] p-4 text-center">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                            <div className="space-y-2">
                              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex justify-center gap-2">
                            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
                            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (members || []).length > 0 ? (
                    (members || []).map((member) => (
                      <TableRow key={member.id} className="transition-colors hover:bg-gray-50/50">
                        <TableCell className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar_url ?? ''} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {(member.name ?? 'U').charAt(0)}
                                {(member.surname ?? 'N').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {member.name} {member.surname}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-sm">{member.email ?? '-'}</TableCell>
                        <TableCell className="p-4 text-sm">{member.phone ?? '-'}</TableCell>
                        <TableCell className="p-4">
                          {getTypeBadge(member.membership_type)}
                        </TableCell>
                        <TableCell className="p-4">
                          {getStatusBadge(member.membership_status)}
                        </TableCell>
                        <TableCell className="p-4 text-sm text-gray-500">
                          {member.join_date
                            ? new Date(member.join_date).toLocaleDateString('tr-TR')
                            : '-'}
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              aria-label={`${member.name} detaylarını görüntüle`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                              aria-label={`${member.name} bilgilerini düzenle`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="p-8 text-center">
                        <UserPlus className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                        <p className="mb-2 text-gray-600">
                          {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                            ? 'Arama kriterlerinize uygun üye bulunamadı.'
                            : 'Henüz hiç üye kaydı yok.'}
                        </p>
                        <Button
                          className="gap-2"
                          onClick={() => {
                            setShowCreateDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          İlk Üyeyi Ekle
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Pagination */}
        {totalCount > pageSize && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  {totalCount} kayıttan {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, totalCount)} arası gösteriliyor
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    disabled={currentPage === 1 || loading}
                    className="px-4"
                  >
                    Önceki
                  </Button>
                  <span className="flex items-center rounded border bg-gray-50 px-3 py-2 text-sm">
                    {currentPage} / {Math.ceil(totalCount / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage((prev) => prev + 1);
                    }}
                    disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
                    className="px-4"
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Member Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Yeni Üye Ekle
            </DialogTitle>
            <DialogDescription>
              Yeni üye bilgilerini doldurun. Zorunlu alanları (*) doldurmanız gereklidir.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMember} className="space-y-4 py-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  Ad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => {
                    setFormData({ ...formData, first_name: e.target.value });
                  }}
                  placeholder="Üyenin adı"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Soyad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => {
                    setFormData({ ...formData, last_name: e.target.value });
                  }}
                  placeholder="Üyenin soyadı"
                  required
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  E-posta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefon <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                  }}
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                }}
                placeholder="Açık adres"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                }}
                placeholder="Şehir"
              />
            </div>

            {/* Membership Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="membership_type">Üyelik Tipi</Label>
                <Select
                  value={formData.membership_type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, membership_type: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Üyelik tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standart</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="corporate">Kurumsal</SelectItem>
                    <SelectItem value="student">Öğrenci</SelectItem>
                    <SelectItem value="senior">Emekli</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="membership_status">Durum</Label>
                <Select
                  value={formData.membership_status}
                  onValueChange={(value) => {
                    setFormData({ ...formData, membership_status: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                    <SelectItem value="suspended">Askıda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => {
                  setFormData({ ...formData, notes: e.target.value });
                }}
                placeholder="Ek notlar veya açıklamalar"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                }}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor...' : 'Üye Ekle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
        }}
        data={members}
        dataType="members"
        title="Üye Listesi Dışa Aktarma"
      />
    </PageLayout>
  );
}
