/**
 * @fileoverview BeneficiaryForm Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Building, CreditCard, Heart, MapPin, Phone, Save, User, X, Camera } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { InputSanitizer } from '../../lib/security/InputSanitizer';
// import type { AidType, BeneficiaryCategory, BeneficiaryFormData } from '../../types/beneficiary';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { CameraScanner } from '../ui/camera-scanner';

import { logger } from '../lib/logging/logger';
import type { OCRResult } from '../../services/ocrService';
// Form validation schema
const beneficiarySchema = z.object({
  // Temel bilgiler
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  identity_no: z.string().regex(/^[0-9]{11}$/, 'Kimlik numarası 11 haneli olmalıdır'),
  nationality: z.string().min(2, 'Uyruk belirtilmelidir'),
  country: z.string().length(2, 'Ülke kodu 2 karakter olmalıdır'),

  // İletişim
  phone: z.string().regex(/^(\+90|0)?5[0-9]{9}$/, 'Geçerli telefon numarası giriniz'),
  email: z.string().email('Geçerli e-posta adresi giriniz').optional().or(z.literal('')),

  // Adres
  city: z.string().min(2, 'Şehir belirtilmelidir'),
  settlement: z.string().min(2, 'Yerleşim yeri belirtilmelidir'),
  neighborhood: z.string().optional(),
  address: z.string().min(10, 'Adres en az 10 karakter olmalıdır'),

  // Demografik
  household_size: z
    .number()
    .min(1, 'Hane büyüklüğü en az 1 olmalıdır')
    .max(20, 'Hane büyüklüğü en fazla 20 olabilir'),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),

  // Yardım
  category: z.enum(['gıda', 'nakdi', 'eğitim', 'sağlık', 'barınma', 'giyim', 'diğer']),
  aid_type: z.enum(['acil', 'düzenli', 'özel']),
  fund_region: z.string().min(2, 'Bölge belirtilmelidir'),

  // Bağlantılar
  linked_orphan: z.boolean().optional(),
  linked_card: z.boolean().optional(),
  card_no: z.string().optional(),

  // Ek bilgiler
  opened_by_unit: z.string().min(2, 'Açan birim belirtilmelidir'),
  iban: z.string().optional(),
  notes: z.string().optional(),

  // Aile üyeleri
  family_members: z.array(z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    surname: z.string().min(2, 'Soyisim en az 2 karakter olmalıdır'),
    phone: z.string().regex(/^(\+90|0)?5[0-9]{9}$/, 'Geçerli telefon numarası giriniz'),
    email: z.string().email('Geçerli e-posta adresi giriniz').optional().or(z.literal('')),
    birth_date: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    identity_number: z.string().optional(),
  })).optional(),

  // İhtiyaçlar
  needs: z.array(z.object({
    type: z.string().min(2, 'İhtiyaç türü belirtilmelidir'),
    description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
    priority: z.enum(['düşük', 'orta', 'yüksek']),
    estimated_cost: z.number().min(0, 'Maliyet negatif olamaz').optional(),
  })).optional(),

  // Sağlık bilgileri
  health_info: z.object({
    has_chronic_disease: z.boolean().optional(),
    chronic_diseases: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    disability_status: z.enum(['yok', 'hafif', 'orta', 'ağır']).optional(),
  }).optional(),

  // Diğer bilgiler
  other_info: z.object({
    education_level: z.enum(['okur_yazar_değil', 'ilkokul', 'ortaokul', 'lise', 'üniversite', 'yüksek_lisans', 'doktora']).optional(),
    occupation: z.string().optional(),
    income_source: z.string().optional(),
    hobbies: z.array(z.string()).optional(),
    special_skills: z.array(z.string()).optional(),
  }).optional(),

  // Belgeler
  documents: z.object({
    photos: z.array(z.any()).optional(),
    files: z.array(z.any()).optional(),
  }).optional(),
});

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

interface BeneficiaryFormProps {
  initialData?: Partial<BeneficiaryFormData>;
  onSubmit: (data: BeneficiaryFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function BeneficiaryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: BeneficiaryFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const totalSteps = 6;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      family_members: [],
      needs: [],
      health_info: {},
      other_info: {},
      documents: {},
      ...initialData,
    },
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: BeneficiaryFormData) => {
    try {
      // Define field types for sanitization
      const fieldTypes: Record<keyof BeneficiaryFormData, string> = {
        full_name: 'name',
        identity_no: 'tcKimlik',
        nationality: 'text',
        country: 'text',
        phone: 'phone',
        email: 'email',
        city: 'text',
        settlement: 'text',
        neighborhood: 'text',
        address: 'address',
        household_size: 'numeric',
        birth_date: 'date',
        gender: 'text',
        family_members: 'text',
        needs: 'text',
        health_info: 'text',
        other_info: 'text',
        documents: 'text',
        notes: 'text',
        risk_level: 'text',
        status: 'text',
        financial_support: 'text',
        housing_status: 'text',
        health_status: 'text',
        education_level: 'text'
      };

      // Sanitize form data
      const sanitizedData = InputSanitizer.validateAndSanitizeForm(data, fieldTypes);
      
      // Submit sanitized data
      await onSubmit(sanitizedData);
      toast.success('Yardım alanı başarıyla kaydedildi');
    } catch (error) {
      toast.error('Kayıt sırasında bir hata oluştu');
      logger.error('Form submission error:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addFamilyMember = () => {
    const currentMembers = getValues('family_members') || [];
    setValue('family_members', [
      ...currentMembers,
      {
        name: '',
        surname: '',
        phone: '',
        email: '',
        birth_date: '',
        gender: 'male',
        identity_number: '',
      },
    ]);
  };

  const removeFamilyMember = (index: number) => {
    const currentMembers = getValues('family_members') || [];
    setValue('family_members', currentMembers.filter((_, i) => i !== index));
  };

  const addNeed = () => {
    const currentNeeds = getValues('needs') || [];
    setValue('needs', [
      ...currentNeeds,
      {
        type: '',
        description: '',
        priority: 'orta',
        estimated_cost: 0,
      },
    ]);
  };

  const removeNeed = (index: number) => {
    const currentNeeds = getValues('needs') || [];
    setValue('needs', currentNeeds.filter((_, i) => i !== index));
  };

  // OCR sonucunu forma doldur
  const handleOCRResult = (result: OCRResult) => {
    try {
      if (result.fullName) {
        setValue('full_name', result.fullName);
      }
      
      if (result.identityNumber) {
        setValue('identity_no', result.identityNumber);
      }
      
      if (result.nationality) {
        setValue('nationality', result.nationality);
      }
      
      if (result.country) {
        setValue('country', result.country);
      }
      
      if (result.birthDate) {
        setValue('birth_date', result.birthDate);
      }
      
      if (result.gender) {
        setValue('gender', result.gender);
      }

      toast.success('Belge bilgileri forma otomatik olarak dolduruldu');
      logger.info('OCR sonucu forma dolduruldu', result);
    } catch (error) {
      toast.error('Form doldurma sırasında hata oluştu');
      logger.error('OCR sonucu form doldurma hatası:', error);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Temel Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Kamera Tarama Butonu */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Hızlı Kayıt</h4>
              <p className="text-sm text-blue-700">
                Kimlik veya pasaport belgenizi kameraya göstererek bilgileri otomatik doldurun
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              variant="outline"
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Camera className="h-4 w-4" />
              Kamera ile Tara
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="full_name">Ad Soyad *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Ad Soyad"
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="identity_no">Kimlik Numarası *</Label>
            <Input
              id="identity_no"
              {...register('identity_no')}
              placeholder="11 haneli kimlik numarası"
            />
            {errors.identity_no && (
              <p className="text-sm text-red-500">{errors.identity_no.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nationality">Uyruk *</Label>
            <Input
              id="nationality"
              {...register('nationality')}
              placeholder="Uyruk"
            />
            {errors.nationality && (
              <p className="text-sm text-red-500">{errors.nationality.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country">Ülke Kodu *</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="TR"
              maxLength={2}
            />
            {errors.country && (
              <p className="text-sm text-red-500">{errors.country.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          İletişim Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="05XX XXX XX XX"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="ornek@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Adres Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Şehir *</Label>
            <Input
              id="city"
              {...register('city')}
              placeholder="Şehir"
            />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="settlement">Yerleşim Yeri *</Label>
            <Input
              id="settlement"
              {...register('settlement')}
              placeholder="İlçe/Mahalle"
            />
            {errors.settlement && (
              <p className="text-sm text-red-500">{errors.settlement.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="neighborhood">Mahalle</Label>
            <Input
              id="neighborhood"
              {...register('neighborhood')}
              placeholder="Mahalle"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Adres *</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Detaylı adres"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Yardım Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Kategori *</Label>
            <Select onValueChange={(value) => { setValue('category', value as any); }}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gıda">Gıda</SelectItem>
                <SelectItem value="nakdi">Nakdi</SelectItem>
                <SelectItem value="eğitim">Eğitim</SelectItem>
                <SelectItem value="sağlık">Sağlık</SelectItem>
                <SelectItem value="barınma">Barınma</SelectItem>
                <SelectItem value="giyim">Giyim</SelectItem>
                <SelectItem value="diğer">Diğer</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="aid_type">Yardım Türü *</Label>
            <Select onValueChange={(value) => { setValue('aid_type', value as any); }}>
              <SelectTrigger>
                <SelectValue placeholder="Yardım türü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acil">Acil</SelectItem>
                <SelectItem value="düzenli">Düzenli</SelectItem>
                <SelectItem value="özel">Özel</SelectItem>
              </SelectContent>
            </Select>
            {errors.aid_type && (
              <p className="text-sm text-red-500">{errors.aid_type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="fund_region">Bölge *</Label>
            <Input
              id="fund_region"
              {...register('fund_region')}
              placeholder="Bölge"
            />
            {errors.fund_region && (
              <p className="text-sm text-red-500">{errors.fund_region.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="opened_by_unit">Açan Birim *</Label>
            <Input
              id="opened_by_unit"
              {...register('opened_by_unit')}
              placeholder="Açan birim"
            />
            {errors.opened_by_unit && (
              <p className="text-sm text-red-500">{errors.opened_by_unit.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="linked_orphan"
              checked={watchedValues.linked_orphan}
              onCheckedChange={(checked) => { setValue('linked_orphan', !!checked); }}
            />
            <Label htmlFor="linked_orphan">Yetim ile bağlantılı</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="linked_card"
              checked={watchedValues.linked_card}
              onCheckedChange={(checked) => { setValue('linked_card', !!checked); }}
            />
            <Label htmlFor="linked_card">Kart ile bağlantılı</Label>
          </div>

          {watchedValues.linked_card && (
            <div>
              <Label htmlFor="card_no">Kart Numarası</Label>
              <Input
                id="card_no"
                {...register('card_no')}
                placeholder="Kart numarası"
              />
            </div>
          )}

          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              {...register('iban')}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
            {errors.iban && (
              <p className="text-sm text-red-500">{errors.iban.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Ek notlar"
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Aile Üyeleri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Aile üyelerini ekleyebilirsiniz
          </p>
          <Button type="button" onClick={addFamilyMember} variant="outline">
            Aile Üyesi Ekle
          </Button>
        </div>

        {(watchedValues.family_members || []).map((member, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Aile Üyesi {index + 1}</h4>
              <Button
                type="button"
                onClick={() => { removeFamilyMember(index); }}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`family_members.${index}.name`}>Ad</Label>
                <Input
                  {...register(`family_members.${index}.name`)}
                  placeholder="Ad"
                />
              </div>

              <div>
                <Label htmlFor={`family_members.${index}.surname`}>Soyad</Label>
                <Input
                  {...register(`family_members.${index}.surname`)}
                  placeholder="Soyad"
                />
              </div>

              <div>
                <Label htmlFor={`family_members.${index}.phone`}>Telefon</Label>
                <Input
                  {...register(`family_members.${index}.phone`)}
                  placeholder="05XX XXX XX XX"
                />
              </div>

              <div>
                <Label htmlFor={`family_members.${index}.email`}>E-posta</Label>
                <Input
                  {...register(`family_members.${index}.email`)}
                  placeholder="ornek@email.com"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderStep6 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          İhtiyaçlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            İhtiyaçları ekleyebilirsiniz
          </p>
          <Button type="button" onClick={addNeed} variant="outline">
            İhtiyaç Ekle
          </Button>
        </div>

        {(watchedValues.needs || []).map((need, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">İhtiyaç {index + 1}</h4>
              <Button
                type="button"
                onClick={() => { removeNeed(index); }}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`needs.${index}.type`}>Tür</Label>
                <Input
                  {...register(`needs.${index}.type`)}
                  placeholder="İhtiyaç türü"
                />
              </div>

              <div>
                <Label htmlFor={`needs.${index}.priority`}>Öncelik</Label>
                <Select onValueChange={(value) => { setValue(`needs.${index}.priority`, value as any); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="düşük">Düşük</SelectItem>
                    <SelectItem value="orta">Orta</SelectItem>
                    <SelectItem value="yüksek">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor={`needs.${index}.description`}>Açıklama</Label>
                <Textarea
                  {...register(`needs.${index}.description`)}
                  placeholder="İhtiyaç açıklaması"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor={`needs.${index}.estimated_cost`}>Tahmini Maliyet</Label>
                <Input
                  type="number"
                  {...register(`needs.${index}.estimated_cost`, { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Yardım Alanı Kayıt Formu</h2>
        <p className="text-gray-600">
          Adım {currentStep} / {totalSteps}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${
              (currentStep / totalSteps) * 100 <= 25 ? 'progress-bar-25' :
              (currentStep / totalSteps) * 100 <= 50 ? 'progress-bar-50' :
              (currentStep / totalSteps) * 100 <= 75 ? 'progress-bar-75' :
              'progress-bar-100'
            }`}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {renderCurrentStep()}

        <div className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button type="button" onClick={prevStep} variant="outline">
                Önceki
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" onClick={onCancel} variant="outline">
                İptal
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Sonraki
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting || isLoading ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Kamera Tarama Modal */}
      <CameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanComplete={handleOCRResult}
        title="Kimlik/Pasaport Tarama"
      />
    </div>
  );
}
