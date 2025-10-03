/**
 * @fileoverview ProfilePage Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import {
  Bell,
  Calendar,
  Camera,
  Edit,
  Eye,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  User,
  UserCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { PageLayout } from '../PageLayout';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DesktopActionButtons } from '../ui/desktop-table';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title?: string;
  bio?: string;
  profileImage?: string;
  avatar?: string;
  department?: string;
  location?: string;
  joinDate?: string;
  showEmail: boolean;
  showPhone: boolean;
  allowContact: boolean;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * ProfilePage function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function ProfilePage() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    location: '',
    joinDate: '',
    bio: '',
    avatar: '',
    showEmail: false,
    showPhone: false,
    allowContact: true,
  });

  // Helper function to safely parse name
  const parseName = (name: string): { firstName: string; lastName: string } => {
    const fullName = name.trim();
    if (!fullName) {
      return { firstName: '', lastName: '' };
    }

    const parts = fullName.split(' ');
    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
    };
  };

  // Load user data from Supabase
  useEffect(() => {
    if (user && isAuthenticated) {
      const userMetadata = user.user_metadata;
      const nameSource = typeof userMetadata.name === 'string' ? userMetadata.name : undefined;
      const emailUsername = user.email?.split('@')[0];
      const displayName = nameSource ?? emailUsername ?? '';

      const { firstName, lastName } = parseName(displayName);

      setProfileData({
        firstName,
        lastName,
        email: user.email ?? '',
        phone: (typeof userMetadata.phone === 'string' ? userMetadata.phone : '') || '',
        title:
          typeof userMetadata.title === 'string' && userMetadata.title
            ? userMetadata.title
            : 'Kullanıcı',
        department:
          typeof userMetadata.department === 'string' && userMetadata.department
            ? userMetadata.department
            : 'Genel',
        location:
          typeof userMetadata.location === 'string' && userMetadata.location
            ? userMetadata.location
            : '',
        joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : '',
        bio: typeof userMetadata.bio === 'string' && userMetadata.bio ? userMetadata.bio : '',
        avatar:
          typeof userMetadata.avatar_url === 'string' && userMetadata.avatar_url
            ? userMetadata.avatar_url
            : '',
        showEmail: false,
        showPhone: false,
        allowContact: true,
      });
    }
  }, [user, isAuthenticated]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    weeklyReports: true,
    systemAlerts: true,
    newDonations: true,
    newMembers: false,
    systemUpdates: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'internal',
    showEmail: false,
    showPhone: false,
    allowContact: true,
  });

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (!validateEmail(profileData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!validatePhone(profileData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      toast.error('Lütfen form hatalarını düzeltin');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Here you would make actual API call
      // const response = await fetch('/api/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileData)
      // });

      setEditMode(false);
      toast.success('Profil bilgileri başarıyla güncellendi', {
        duration: 3000,
      });
    } catch {
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would make actual API call
      // const response = await fetch('/api/notifications', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notificationSettings)
      // });

      toast.success('Bildirim ayarları kaydedildi', {
        duration: 2000,
      });
    } catch {
      toast.error('Bildirim ayarları güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would make actual API call
      // const response = await fetch('/api/privacy', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(privacySettings)
      // });

      toast.success('Gizlilik ayarları güncellendi', {
        duration: 2000,
      });
    } catch {
      toast.error('Gizlilik ayarları güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout
      title="Profil Ayarları"
      subtitle="Hesap bilgilerinizi ve tercihlerinizi yönetin"
      actions={
        <DesktopActionButtons
          primaryAction={
            editMode
              ? {
                  label: 'Kaydet',
                  icon: <Save className="w-4 h-4" />,
                  onClick: () => {
                    void handleSaveProfile();
                  },
                }
              : {
                  label: 'Düzenle',
                  icon: <Edit className="w-4 h-4" />,
                  onClick: () => {
                    setEditMode(true);
                  },
                }
          }
          secondaryActions={
            editMode
              ? [
                  {
                    label: 'İptal',
                    onClick: () => {
                      setEditMode(false);
                    },
                    variant: 'outline',
                  },
                ]
              : []
          }
        />
      }
    >
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Desktop Profile Header */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="relative flex-shrink-0">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatar} alt="Profile" />
                  <AvatarFallback className="bg-blue-600 text-white text-xl">
                    {profileData.firstName[0]}
                    {profileData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                {editMode && (
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => {
                      document.getElementById('avatar-input')?.click();
                    }}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <Badge className="bg-green-100 text-green-800 mx-auto sm:mx-0 w-fit">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Aktif
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  {profileData.title} • {profileData.department}
                </p>

                {/* Mobile-First Contact Info */}
                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-4 text-sm">
                  <div className="flex items-center justify-center sm:justify-start gap-2 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                    <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{profileData.email}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                    <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{profileData.phone}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      <span className="sm:hidden">Başlangıç: </span>
                      <span className="hidden sm:inline">Başlangıç: </span>
                      {profileData.joinDate
                        ? new Date(profileData.joinDate).toLocaleDateString('tr-TR')
                        : 'Belirtilmemiş'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-Optimized Profile Settings Tabs */}
        <Tabs defaultValue="personal" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
            <TabsTrigger value="personal" className="min-h-[44px] text-sm sm:text-base">
              <User className="w-4 h-4 mr-2 sm:hidden" />
              Kişisel Bilgiler
            </TabsTrigger>
            <TabsTrigger value="notifications" className="min-h-[44px] text-sm sm:text-base">
              <Bell className="w-4 h-4 mr-2 sm:hidden" />
              Bildirimler
            </TabsTrigger>
            <TabsTrigger value="privacy" className="min-h-[44px] text-sm sm:text-base">
              <Shield className="w-4 h-4 mr-2 sm:hidden" />
              Gizlilik
            </TabsTrigger>
          </TabsList>

          {/* Mobile-Optimized Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="w-5 h-5 text-blue-600" />
                  Kişisel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      readOnly={!editMode}
                      onChange={(e) => {
                        setProfileData({ ...profileData, firstName: e.target.value });
                        if (errors.firstName) {
                          setErrors({ ...errors, firstName: '' });
                        }
                      }}
                      className={`min-h-[44px] text-base ${
                        errors.firstName ? 'border-red-500' : ''
                      }`}
                      inputMode="text"
                    />
                    {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      readOnly={!editMode}
                      onChange={(e) => {
                        setProfileData({ ...profileData, lastName: e.target.value });
                        if (errors.lastName) {
                          setErrors({ ...errors, lastName: '' });
                        }
                      }}
                      className={`min-h-[44px] text-base ${
                        errors.lastName ? 'border-red-500' : ''
                      }`}
                      inputMode="text"
                    />
                    {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      readOnly={!editMode}
                      onChange={(e) => {
                        setProfileData({ ...profileData, email: e.target.value });
                        if (errors.email) {
                          setErrors({ ...errors, email: '' });
                        }
                      }}
                      className={`min-h-[44px] text-base ${errors.email ? 'border-red-500' : ''}`}
                      inputMode="email"
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      readOnly={!editMode}
                      onChange={(e) => {
                        setProfileData({ ...profileData, phone: e.target.value });
                        if (errors.phone) {
                          setErrors({ ...errors, phone: '' });
                        }
                      }}
                      className={`min-h-[44px] text-base ${errors.phone ? 'border-red-500' : ''}`}
                      inputMode="tel"
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Unvan</Label>
                    <Input
                      id="title"
                      value={profileData.title}
                      readOnly={!editMode}
                      onChange={(e) => {
                        setProfileData({ ...profileData, title: e.target.value });
                      }}
                      className="min-h-[44px] text-base"
                      inputMode="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departman</Label>
                    <Select
                      value={profileData.department}
                      onValueChange={(value) => {
                        setProfileData({ ...profileData, department: value });
                      }}
                      disabled={!editMode}
                    >
                      <SelectTrigger className="min-h-[44px] text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bilgi İşlem">Bilgi İşlem</SelectItem>
                        <SelectItem value="Yönetim">Yönetim</SelectItem>
                        <SelectItem value="Muhasebe">Muhasebe</SelectItem>
                        <SelectItem value="İnsan Kaynakları">İnsan Kaynakları</SelectItem>
                        <SelectItem value="Operasyon">Operasyon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biyografi</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    readOnly={!editMode}
                    onChange={(e) => {
                      setProfileData({ ...profileData, bio: e.target.value });
                    }}
                    rows={4}
                    placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
                    className="min-h-[100px] text-base resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    Bildirim Ayarları
                  </CardTitle>
                  <Button
                    onClick={() => {
                      void handleSaveNotifications();
                    }}
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General Notifications */}
                <div className="space-y-4">
                  <h3 className="font-medium">Genel Bildirimler</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">E-posta Bildirimleri</Label>
                        <p className="text-sm text-muted-foreground">
                          Önemli güncellemeler e-posta ile gönderilsin
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => {
                          setNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: checked,
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push Bildirimleri</Label>
                        <p className="text-sm text-muted-foreground">
                          Tarayıcı bildirimleri aktif olsun
                        </p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => {
                          setNotificationSettings({
                            ...notificationSettings,
                            pushNotifications: checked,
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications">SMS Bildirimleri</Label>
                        <p className="text-sm text-muted-foreground">
                          Kritik uyarılar SMS ile gönderilsin
                        </p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => {
                          setNotificationSettings({
                            ...notificationSettings,
                            smsNotifications: checked,
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* System Notifications */}
                <div className="space-y-4">
                  <h3 className="font-medium">Sistem Bildirimleri</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="system-alerts">Sistem Uyarıları</Label>
                        <p className="text-sm text-muted-foreground">
                          Sistem hataları ve uyarıları
                        </p>
                      </div>
                      <Switch
                        id="system-alerts"
                        checked={notificationSettings.systemAlerts}
                        onCheckedChange={(checked) => {
                          setNotificationSettings({
                            ...notificationSettings,
                            systemAlerts: checked,
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-reports">Haftalık Raporlar</Label>
                        <p className="text-sm text-muted-foreground">Haftalık aktivite özetleri</p>
                      </div>
                      <Switch
                        id="weekly-reports"
                        checked={notificationSettings.weeklyReports}
                        onCheckedChange={(checked) => {
                          setNotificationSettings({
                            ...notificationSettings,
                            weeklyReports: checked,
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-donations">Yeni Bağışlar</Label>
                        <p className="text-sm text-muted-foreground">
                          Yeni bağış geldiğinde bildirim
                        </p>
                      </div>
                      <Switch
                        id="new-donations"
                        checked={notificationSettings.newDonations}
                        onCheckedChange={(checked) => {
                          setNotificationSettings({
                            ...notificationSettings,
                            newDonations: checked,
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Gizlilik ve Güvenlik
                  </CardTitle>
                  <Button
                    onClick={() => {
                      void handleSavePrivacy();
                    }}
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Visibility */}
                <div className="space-y-4">
                  <h3 className="font-medium">Profil Görünürlüğü</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="profile-visibility">Kim profilinizi görebilir?</Label>
                      <Select
                        value={privacySettings.profileVisibility}
                        onValueChange={(value) => {
                          setPrivacySettings({ ...privacySettings, profileVisibility: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Herkes</SelectItem>
                          <SelectItem value="internal">Sadece Dernek Üyeleri</SelectItem>
                          <SelectItem value="private">Sadece Yöneticiler</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-email">E-posta Adresini Göster</Label>
                        <p className="text-sm text-muted-foreground">
                          E-posta adresiniz profilde görünsün
                        </p>
                      </div>
                      <Switch
                        id="show-email"
                        checked={privacySettings.showEmail}
                        onCheckedChange={(checked) => {
                          setPrivacySettings({ ...privacySettings, showEmail: checked });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-phone">Telefon Numarasını Göster</Label>
                        <p className="text-sm text-muted-foreground">
                          Telefon numaranız profilde görünsün
                        </p>
                      </div>
                      <Switch
                        id="show-phone"
                        checked={privacySettings.showPhone}
                        onCheckedChange={(checked) => {
                          setPrivacySettings({ ...privacySettings, showPhone: checked });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Security Section */}
                <div className="space-y-4">
                  <h3 className="font-medium">Güvenlik</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Here you would open a password change modal/dialog
                        toast.info('Şifre değiştirme sayfasına yönlendiriliyorsunuz...');
                        // Example: router.push('/change-password');
                      }}
                      disabled={isLoading}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Şifre Değiştir
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Here you would open 2FA setup modal/dialog
                        toast.info('İki faktörlü doğrulama ayarları açılıyor...');
                        // Example: setShow2FAModal(true);
                      }}
                      disabled={isLoading}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      İki Faktörlü Doğrulama
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Here you would open login history modal/dialog
                        toast.info('Giriş geçmişi görüntüleniyor...');
                        // Example: setShowLoginHistoryModal(true);
                      }}
                      disabled={isLoading}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Giriş Geçmişi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
