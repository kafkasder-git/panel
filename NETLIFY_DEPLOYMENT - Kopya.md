# 🚀 Netlify Deployment Guide - Kafkasder Dernek Yönetim Sistemi

Bu rehber, Kafkasder Dernek Yönetim Sistemi'ni Netlify'da nasıl deploy edeceğinizi adım adım açıklar.

## 📋 Gereksinimler

- Node.js 18+
- NPM 9+
- Git repository
- Netlify hesabı
- Supabase projesi ve anahtarları

## 🛠️ Kurulum

### 1. Netlify CLI Kurulumu

```bash
# Netlify CLI'yi global olarak kur
npm install -g netlify-cli

# Netlify'ye login ol
netlify login
```

### 2. Environment Variables Ayarlama

Netlify Dashboard'da veya CLI ile environment variables'ları ayarlayın:

```bash
# CLI ile environment variables ekle
netlify env:set VITE_SUPABASE_URL "your_supabase_url"
netlify env:set VITE_SUPABASE_ANON_KEY "your_supabase_anon_key"
netlify env:set NODE_ENV "production"
```

### 3. Manuel Deploy

```bash
# Build dosyalarını oluştur
npm run netlify:build

# Preview deploy (test için)
netlify deploy

# Production deploy
netlify deploy --prod
```

## 🔄 Otomatik Deploy (GitHub Integration)

### 1. Netlify Dashboard Setup

1. [Netlify Dashboard](https://app.netlify.com)'a git
2. **"New site from Git"** butonuna tıkla
3. **GitHub** seç ve repository'yi bağla
4. Build ayarlarını yap:
   - **Base directory:** (boş bırak)
   - **Build command:** `npm run netlify:build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`

### 2. Environment Variables (Dashboard)

Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_SUPABASE_URL = your_supabase_url_here
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key_here
NODE_ENV = production
```

## 📊 Build Komutları

```bash
# Development
npm run dev                    # Local development server
npm run netlify:dev           # Netlify dev server (functions ile)

# Build & Deploy
npm run netlify:build         # Quality check + build
npm run netlify:deploy        # Preview deploy
npm run netlify:deploy:prod   # Production deploy

# Testing
npm run test                  # Unit tests
npm run test:e2e             # E2E tests
npm run quality:check        # Lint + type-check + format
```

## 🔧 Netlify Konfigürasyonu

Proje `netlify.toml` dosyası aşağıdaki özellikleri içerir:

### Build Ayarları
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18
- **SPA Routing:** Tüm routes → `index.html`

### Güvenlik Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-XSS-Protection
- HSTS (Strict Transport Security)
- Referrer Policy

### Cache Ayarları
- Static assets: 1 yıl cache
- HTML: No cache
- PWA files: Özel cache politikaları

## 🔐 Güvenlik

### Environment Variables Güvenliği
- **KRİTİK:** `.env` dosyalarını asla commit etmeyin
- Production anahtarları sadece Netlify Dashboard'da ayarlayın
- Hardcoded credentials kullanmayın (secrets scanning engelleyecek)
- `.env.example` dosyasında sadece placeholder değerler kullanın

### CSP (Content Security Policy)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
```

## 📱 PWA Desteği

Netlify otomatik olarak PWA dosyalarını serve eder:
- `manifest.json` - Web app manifest
- `sw.js` - Service worker
- Icon dosyları - PWA iconları

## 🌐 Domain Ayarları

### Custom Domain
1. Netlify Dashboard → Domain Settings
2. **Add custom domain** tıkla
3. DNS ayarlarını yap:
   ```
   CNAME www your-site.netlify.app
   A @ 75.2.60.5
   ```

### HTTPS
- Netlify otomatik SSL certificate sağlar
- Let's Encrypt kullanır
- Otomatik yenileme

## 📊 Monitoring ve Analytics

### Build Monitoring
- Build logları Netlify dashboard'da
- Build süreleri ve başarı oranları
- Deploy preview'ları

### Performance
- Lighthouse scores
- Core Web Vitals
- Bundle analysis: `npm run analyze`

## 🐛 Troubleshooting

### Yaygın Sorunlar

#### Build Hatası
```bash
# Dependencies temizle
npm run clean
npm install

# Local build test et
npm run build
npm run preview
```

#### Environment Variables
```bash
# Variables'ları kontrol et
netlify env:list

# Yeniden ayarla
netlify env:set VARIABLE_NAME "new_value"
```

#### Cache Sorunları
```bash
# Netlify cache temizle
netlify build --clear-cache

# Local cache temizle
npm run clean
```

## 📈 Performance Optimizasyonu

### Bundle Size
- Vite otomatik code splitting
- Manual chunks ayarlanmış
- Tree shaking aktif

### CDN
- Netlify global CDN
- Otomatik asset optimization
- Image optimization

## 🔄 Deployment Workflow

1. **Development**
   ```bash
   npm run dev
   ```

2. **Quality Check**
   ```bash
   npm run quality:check
   ```

3. **Build Test**
   ```bash
   npm run build
   npm run preview
   ```

4. **Deploy**
   ```bash
   git push origin main  # Otomatik deploy
   # veya
   netlify deploy --prod  # Manuel deploy
   ```

## 📞 Support

### Links
- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [Netlify Status](https://netlifystatus.com/)

### Project Issues
- GitHub Issues: Repository issues tab
- Build logs: Netlify dashboard

---

**Deploy URL'niz:** `https://your-site-name.netlify.app`

Deployment tamamlandıktan sonra URL'nizi alacaksınız! 🎉