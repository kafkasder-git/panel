# 🚀 Netlify Dashboard - Plugin Kaldırma ve Environment Variables

## 🚨 ACIL: Lighthouse Plugin Kaldırma

### Adım 1: Netlify Dashboard'a Giriş

```
URL: https://app.netlify.com/projects/elaborate-semifreddo-5d54d0
```

### Adım 2: Plugin'i Kaldır

1. **Sol menü** → **"Plugins"** sekmesi
2. **"@netlify/plugin-lighthouse"** bul
3. **"Remove"** veya **"Delete"** butonuna tıkla
4. Onay ver

### Adım 3: Redeploy Tetikle

1. **"Deploys"** sekmesi
2. **"Trigger deploy"** → **"Deploy site"**
3. Build loglarını takip et

## 🔧 Environment Variables Ayarlama

### Adım 4: Environment Variables Ekle

1. **Site settings** → **Environment variables**
2. Aşağıdaki değişkenleri ekle:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CSRF_SECRET=your_random_secret_key
NODE_ENV=production
VITE_APP_MODE=production
```

### Supabase Değerleri Nasıl Bulunur?

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **Settings** → **API**
3. **Project URL** → `VITE_SUPABASE_URL`
4. **anon public** key → `VITE_SUPABASE_ANON_KEY`

### CSRF Secret Nasıl Oluşturulur?

```bash
# Terminal'de çalıştır:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ Deployment Sonrası Test

### Adım 5: Site Test

1. **Site URL'ini ziyaret et:**

   ```
   https://elaborate-semifreddo-5d54d0.netlify.app
   ```

2. **Temel işlevleri test et:**
   - ✅ Sayfa yükleniyor
   - ✅ Navigation çalışıyor
   - ✅ PWA manifest yükleniyor
   - ✅ Service Worker aktif

### Adım 6: Performance Test

```bash
# Local'de Lighthouse test
npm run build
npm run preview
# Chrome DevTools → Lighthouse → Generate report
```

## 🎯 Beklenen Sonuç

Plugin kaldırıldıktan sonra:

- ✅ Build başarılı olacak (exit code: 0)
- ✅ Site production'da çalışacak
- ✅ Tüm özellikler aktif olacak

## 📊 Performance Monitoring Alternatifleri

### 1. Chrome DevTools Lighthouse

```bash
npm run build
npm run preview
# Chrome DevTools → Lighthouse
```

### 2. Netlify Analytics

- Dashboard → Analytics → Enable
- Gerçek zamanlı metrikler

### 3. Web Vitals Monitoring

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 🚨 Sorun Giderme

### Build Hala Başarısız Oluyorsa:

1. **Build logs'u kontrol et**
2. **Environment variables doğru mu?**
3. **Supabase connection test et**
4. **Local build test et:** `npm run build`

### Supabase Connection Hatası:

```bash
# Local'de test
npm run dev
# Console'da Supabase connection loglarını kontrol et
```

## 🎉 Başarı Kriterleri

- ✅ Build exit code: 0
- ✅ Site erişilebilir
- ✅ PWA manifest yükleniyor
- ✅ Supabase connection başarılı
- ✅ Environment variables aktif

---

**Son Güncelleme:** 2025-01-03  
**Durum:** Netlify Dashboard'da plugin kaldırılmalı
