/**
 * @fileoverview KumbaraPage Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import {
  Calendar,
  DollarSign,
  Download,
  Edit,
  Eye,
  MapPin,
  Plus,
  Printer,
  QrCode,
  Search,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { PageLoading } from '../LoadingSpinner';
import { PageLayout } from '../PageLayout';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { sanitizeText } from '../../lib/security/sanitization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';

interface Kumbara {
  id: number;
  code: string;
  name: string;
  location: string;
  address: string;
  status: 'Aktif' | 'Pasif' | 'Bakımda';
  installDate: string;
  lastCollection: string;
  totalAmount: number;
  monthlyAverage: number;
  qrCode: string;
  contactPerson?: string;
  phone?: string;
  notes?: string;
}

// Mock data kaldırıldı - gerçek veriler API'den gelecek

/**
 * KumbaraPage function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function KumbaraPage() {
  const [loading, _setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kumbaralar] = useState<Kumbara[]>([]);
  const [selectedKumbara, setSelectedKumbara] = useState<Kumbara | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const filteredKumbaralar = kumbaralar.filter((kumbara) => {
    const matchesSearch =
      kumbara.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kumbara.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kumbara.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || kumbara.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Kumbara['status']) => {
    const variants = {
      Aktif: 'bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold',
      Pasif: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
      Bakımda: 'bg-amber-100 text-amber-700 border-amber-200 font-semibold',
    };
    return <Badge className={`${variants[status]} px-3 py-1 rounded-full border`}>{status}</Badge>;
  };

  const generateQRCode = (kumbara: Kumbara) => {
    // QR kod simülasyonu - gerçek uygulamada QR kütüphanesi kullanılacak
    const qrData = {
      kumbaraId: kumbara.id,
      code: kumbara.code,
      name: kumbara.name,
      location: kumbara.location,
      url: `https://bagis.dernek.org/kumbara/${kumbara.code}`,
    };
    return JSON.stringify(qrData);
  };

  const printQRCode = (kumbara: Kumbara) => {
    const printWindow = window.open('', '_blank');
    
    // SECURITY FIX: Sanitize all user input before using in document.write to prevent XSS
    // deepcode ignore DOMXSS: All user inputs (code, name, location) are sanitized with sanitizeText()
    const sanitizedCode = sanitizeText(kumbara.code);
    const sanitizedName = sanitizeText(kumbara.name);
    const sanitizedLocation = sanitizeText(kumbara.location);

    const qrContent = `
      <html>
        <head>
          <title>Kumbara QR Kod - ${sanitizedCode}</title>
          <style>
            @page { size: 40mm 30mm; margin: 2mm; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 26mm;
              width: 36mm;
            }
            .qr-container {
              text-align: center;
              border: 1px solid #ddd;
              padding: 2mm;
              border-radius: 2mm;
            }
            .qr-placeholder {
              width: 20mm;
              height: 20mm;
              border: 2px solid #333;
              margin: 0 auto 1mm auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              background: #f9f9f9;
            }
            .qr-info {
              font-size: 6px;
              margin: 0;
              line-height: 1.2;
            }
            .qr-code {
              font-weight: bold;
              margin-bottom: 0.5mm;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-placeholder">QR KOD</div>
            <div class="qr-info qr-code">${sanitizedCode}</div>
            <div class="qr-info">${sanitizedName}</div>
            <div class="qr-info">${sanitizedLocation}</div>
          </div>
        </body>
      </html>
    `;

    if (printWindow) {
      printWindow.document.write(qrContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const totalKumbaralar = kumbaralar.length;
  const aktifKumbaralar = kumbaralar.filter((k) => k.status === 'Aktif').length;
  const toplamGelir = kumbaralar.reduce((sum, k) => sum + k.totalAmount, 0);
  const aylikOrtalama = kumbaralar.reduce((sum, k) => sum + k.monthlyAverage, 0);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <PageLayout
      title="Kumbara Takibi"
      subtitle="Kumbara yerleştirme, takip ve gelir yönetimi"
      actions={
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Rapor Al
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setIsAddDialogOpen(true);
            }}
            className="h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kumbara
          </Button>
        </div>
      }
    >
      <div className="p-8 space-y-8 bg-gradient-to-br from-slate-50/50 to-blue-50/30">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-bold text-slate-700 mb-1">{totalKumbaralar}</div>
                  <p className="text-sm text-slate-500 font-medium">Toplam Kumbara</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-bold text-slate-700 mb-1">{aktifKumbaralar}</div>
                  <p className="text-sm text-slate-500 font-medium">Aktif Kumbara</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-bold text-slate-700 mb-1">
                    ₺{toplamGelir.toLocaleString()}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Toplam Gelir</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-bold text-slate-700 mb-1">
                    ₺{aylikOrtalama.toLocaleString()}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Aylık Ortalama</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl text-slate-800">Kumbara Listesi</CardTitle>
                <p className="text-slate-500">Tüm kumbara konumlarını görüntüleyin ve yönetin</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Kumbara ara..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    className="pl-12 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl shadow-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl shadow-sm">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Pasif">Pasif</SelectItem>
                    <SelectItem value="Bakımda">Bakımda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-slate-200">
                    <TableHead className="font-semibold text-slate-700">Kumbara Kodu</TableHead>
                    <TableHead className="font-semibold text-slate-700">İsim & Lokasyon</TableHead>
                    <TableHead className="font-semibold text-slate-700">Durum</TableHead>
                    <TableHead className="font-semibold text-slate-700">Son Toplama</TableHead>
                    <TableHead className="font-semibold text-slate-700">Toplam Gelir</TableHead>
                    <TableHead className="font-semibold text-slate-700">Aylık Ort.</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">
                      İşlemler
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKumbaralar.map((kumbara, index) => (
                    <TableRow
                      key={kumbara.id}
                      className={`hover:bg-blue-50/50 transition-colors duration-200 border-slate-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <TableCell className="py-4">
                        <div className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block">
                          {kumbara.code}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800">{kumbara.name}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {kumbara.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">{getStatusBadge(kumbara.status)}</TableCell>
                      <TableCell className="text-slate-600 py-4 font-medium">
                        {new Date(kumbara.lastCollection).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600 py-4">
                        ₺{kumbara.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600 py-4">
                        ₺{kumbara.monthlyAverage.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            onClick={() => {
                              setSelectedKumbara(kumbara);
                              setIsQrDialogOpen(true);
                            }}
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-colors"
                            onClick={() => {
                              printQRCode(kumbara);
                            }}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 rounded-lg hover:bg-green-100 hover:text-green-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 rounded-lg hover:bg-amber-100 hover:text-amber-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add New Kumbara Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg border-0 shadow-2xl rounded-2xl bg-white">
            <DialogHeader className="space-y-3 pb-6">
              <DialogTitle className="text-2xl text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                Yeni Kumbara Ekle
              </DialogTitle>
              <DialogDescription className="text-slate-600 leading-relaxed">
                Yeni kumbara konumu ekleyin ve otomatik QR kod üretimi için gerekli bilgileri
                doldurun.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-slate-700 font-semibold">
                    Kumbara Adı
                  </Label>
                  <Input
                    id="name"
                    placeholder="Merkez Camii Kumbarası"
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="location" className="text-slate-700 font-semibold">
                    Lokasyon
                  </Label>
                  <Input
                    id="location"
                    placeholder="Fatih Camii"
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="address" className="text-slate-700 font-semibold">
                  Adres
                </Label>
                <Textarea
                  id="address"
                  placeholder="Tam adres bilgisi..."
                  rows={3}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="contact" className="text-slate-700 font-semibold">
                    İletişim Kişisi
                  </Label>
                  <Input
                    id="contact"
                    placeholder="Ahmet Öztürk"
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-slate-700 font-semibold">
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    placeholder="0532 123 45 67"
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes" className="text-slate-700 font-semibold">
                  Notlar
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Özel notlar..."
                  rows={3}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl resize-none"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-slate-200 hover:bg-slate-50 rounded-xl"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                  }}
                >
                  İptal
                </Button>
                <Button className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg">
                  <QrCode className="w-5 h-5 mr-2" />
                  QR Kod ile Ekle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent className="max-w-md border-0 shadow-2xl rounded-2xl bg-white">
            <DialogHeader className="space-y-3 pb-6">
              <DialogTitle className="text-2xl text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                QR Kod - {selectedKumbara?.code}
              </DialogTitle>
              <DialogDescription className="text-slate-600 leading-relaxed">
                Kumbara için benzersiz QR kodu görüntüleyin ve 40x30mm boyutunda yazdırın.
              </DialogDescription>
            </DialogHeader>
            {selectedKumbara && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl text-center border border-slate-100">
                  <div className="w-40 h-40 mx-auto bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <div className="text-center">
                      <QrCode className="w-20 h-20 mx-auto text-slate-400 mb-3" />
                      <div className="text-xs text-slate-500 font-medium">QR Kod Simülasyonu</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-slate-800">{selectedKumbara.name}</div>
                    <div className="text-sm text-slate-600 flex items-center justify-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedKumbara.location}
                    </div>
                    <div className="text-sm font-mono text-blue-600 bg-blue-100 px-3 py-1 rounded-lg inline-block mt-3">
                      {selectedKumbara.code}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                  <div className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    📱 QR Kod Bilgileri
                  </div>
                  <div className="space-y-2 text-blue-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Kumbara ID:</span>
                      <span>{selectedKumbara.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Kod:</span>
                      <span className="font-mono">{selectedKumbara.code}</span>
                    </div>
                    <div className="pt-2">
                      <span className="font-medium">URL:</span>
                      <div className="text-xs bg-white p-2 rounded-lg mt-1 font-mono break-all">
                        bagis.dernek.org/kumbara/{selectedKumbara.code}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-slate-200 hover:bg-slate-50 rounded-xl"
                    onClick={() => {
                      printQRCode(selectedKumbara);
                    }}
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    40x30mm Yazdır
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg"
                    onClick={() => {
                      // QR kod verilerini kopyala
                      navigator.clipboard.writeText(generateQRCode(selectedKumbara));
                    }}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Kodu Kopyala
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
