# 🏛️ Dernek Yönetim Sistemi

Modern, güvenli ve ölçeklenebilir dernek yönetim sistemi. React, TypeScript ve
Supabase ile geliştirilmiştir.

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı

### Kurulum

```bash
# Repository'yi klonlayın
git clone <repository-url>
cd kafkasderpanel.com-main-3

# Dependencies yükleyin
npm install

# Environment variables ayarlayın
cp .env.example .env.local
# .env.local dosyasını düzenleyin

# Development server başlatın
npm run dev
```

## 🏗️ Teknoloji Stack

### Frontend

- **React 18** - Modern React hooks ve concurrent features
- **TypeScript** - Strict mode ile tip güvenliği
- **Vite** - Hızlı build ve development server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **Zustand** - Lightweight state management

### Backend & Database

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level security

### Development Tools

- **ESLint** - Code linting ve quality
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## 📁 Proje Yapısı

```text
src/
├── components/          # React components
│   ├── auth/           # Authentication
│   ├── forms/          # Form components
│   ├── pages/          # Page components
│   └── ui/             # UI components
├── services/           # Business logic
│   ├── beneficiariesService.ts
│   ├── donationsService.ts
│   └── ...
├── hooks/              # Custom React hooks
├── stores/             # Zustand stores
├── types/              # TypeScript definitions
├── lib/                # Utility libraries
└── scripts/            # Build and utility scripts
```

## 🎯 Ana Özellikler

### 👥 Üye Yönetimi

- Üye kayıt ve güncelleme
- Üye arama ve filtreleme
- Üye istatistikleri
- Toplu işlemler

### 💰 Bağış Yönetimi

- Bağış kayıt sistemi
- Bağışçı takibi
- Raporlama ve analiz
- Otomatik bildirimler

### 🤝 İhtiyaç Sahipleri

- Yardım başvuru sistemi
- Durum takibi
- Aile bilgileri
- Belge yönetimi

### 📊 Raporlama

- Detaylı analizler
- Grafik ve tablolar
- Excel/PDF export
- Otomatik raporlar

### 🔐 Güvenlik

- XSS koruması
- SQL Injection koruması
- CSRF koruması
- Rate limiting
- Input sanitization

## 🛠️ Geliştirme

### Komutlar

```bash
# Development
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build

# Testing
npm test             # Unit tests
npm run test:coverage # Test coverage
npm run test:e2e     # E2E tests

# Code Quality
npm run lint         # ESLint check
npm run lint:fix     # ESLint fix
npm run type-check   # TypeScript check
npm run format       # Prettier format
```

### GitHub Copilot Kullanımı

Bu proje GitHub Copilot ile optimize edilmiştir. Detaylı kullanım için:

- [Copilot Integration Guide](./COPILOT_INTEGRATION_GUIDE.md)
- [Project Status Report](./PROJECT_STATUS_REPORT.md)

## 🚀 Deployment

### Netlify (Önerilen)

```bash
# 1. Environment variables ayarla (Netlify Dashboard'da)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 2. Netlify CLI ile deploy
npm i -g netlify-cli
netlify login
netlify deploy --prod

# 3. GitHub Integration ile otomatik
git push origin main
```

**⚠️ ÖNEMLİ:** `.env` dosyalarını repository'ye commit etmeyin! Environment variables'ları Netlify Dashboard'da ayarlayın.

**Detaylı Netlify deployment rehberi:** [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Other
VITE_APP_NAME=Dernek Yönetim Sistemi
VITE_APP_VERSION=1.0.0
```

## 📊 Performans

### Metrikler

- **Build Time:** < 2 dakika
- **Bundle Size:** Optimize edildi
- **Lighthouse Score:** 90+
- **Test Coverage:** 80%+
- **Core Web Vitals:** Optimized
- **API Response Time:** < 200ms

### Optimizasyonlar

- React memo, useMemo, useCallback
- Lazy loading ve code splitting
- Image optimization
- Bundle analysis
- Service Worker caching
- Rate limiting
- Database query optimization
- Virtual scrolling for large lists

## 🔒 Güvenlik

### Uygulanan Güvenlik Önlemleri

- **XSS Protection** - Input sanitization with DOMPurify
- **SQL Injection Protection** - Parameterized queries
- **CSRF Protection** - Token validation
- **Rate Limiting** - Request throttling (100 req/min)
- **Input Validation** - Client ve server-side with Zod
- **2FA/MFA** - Two-factor authentication support
- **Security Headers** - CSP, HSTS, X-Frame-Options
- **Row Level Security** - Database-level access control
- **Encrypted Storage** - Sensitive data encryption

### Güvenlik Kontrolleri

```bash
# Security audit
npm audit

# Dependency check
npm run security:check

# Run security audit script
bash scripts/security-audit.sh

# Check for vulnerabilities
npm run deps:audit
```

## 🧪 Testing

### Test Stratejisi

- **Unit Tests** - Vitest ile
- **Integration Tests** - Service layer
- **E2E Tests** - Playwright ile
- **Visual Tests** - Component testing

### Test Coverage

```bash
# Coverage raporu
npm run test:coverage

# Coverage threshold: 80%
```

## 📈 Monitoring

### Error Tracking

- **Console Logging** - Structured logging
- **Performance Monitoring** - Core Web Vitals

### Analytics

- **User Behavior** - Page views, interactions
- **Performance Metrics** - Load times, errors
- **Business Metrics** - Donations, members

## 🤝 Katkıda Bulunma

### Geliştirme Süreci

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Kod Standartları

- TypeScript strict mode
- ESLint kuralları
- Prettier formatting
- JSDoc yorumları
- Test coverage

## 📚 Dokümantasyon

### 📁 Organize Edilmiş Dokümantasyon Yapısı

```
docs/
├── deployment/          # Deployment dokümantasyonları
│   ├── CLOUDFLARE_DEPLOYMENT.md
│   ├── CLOUDFLARE_MANUAL_DEPLOY.md
│   ├── DEPLOYMENT_QUICKSTART.md
│   ├── DEPLOYMENT.md
│   └── QUICK_DEPLOY_GUIDE.md
├── setup/              # Kurulum ve konfigürasyon
│   ├── GITHUB_ACTIONS_SETUP.md
│   ├── MCP_SETUP.md
│   ├── SUPABASE_SETUP.md
│   └── TOKEN_SETUP.md
├── reports/            # Raporlar ve teknik dokümantasyon
│   ├── TECHNICAL_DOCUMENTATION.md
│   ├── TESTSPRITE_FIXES_PROGRESS.md
│   └── TESTSPRITE_PROGRESS_REPORT.md
├── security/            # Güvenlik dokümantasyonları
│   └── security-audit-report-20251007_202150.txt
├── api/               # API dokümantasyonları
├── TESTING_GUIDE.md
├── TYPESCRIPT_CONFIG.md
└── USER_GUIDE.md
```

### 🚀 Deployment Dokümantasyonları

- [Cloudflare Deployment](./docs/deployment/CLOUDFLARE_DEPLOYMENT.md) - Cloudflare deployment rehberi
- [Manual Deploy](./docs/deployment/CLOUDFLARE_MANUAL_DEPLOY.md) - Manuel deployment
- [Quick Deploy Guide](./docs/deployment/QUICK_DEPLOY_GUIDE.md) - Hızlı deployment
- [Deployment Quickstart](./docs/deployment/DEPLOYMENT_QUICKSTART.md) - Deployment başlangıç rehberi

### ⚙️ Setup ve Konfigürasyon

- [Supabase Setup](./docs/setup/SUPABASE_SETUP.md) - Supabase kurulumu
- [Token Setup](./docs/setup/TOKEN_SETUP.md) - Token konfigürasyonu
- [MCP Setup](./docs/setup/MCP_SETUP.md) - MCP kurulumu
- [GitHub Actions Setup](./docs/setup/GITHUB_ACTIONS_SETUP.md) - CI/CD kurulumu

### 📊 Raporlar ve Teknik Dokümantasyon

- [Technical Documentation](./docs/reports/TECHNICAL_DOCUMENTATION.md) - Teknik dokümantasyon
- [TestSprite Progress Report](./docs/reports/TESTSPRITE_PROGRESS_REPORT.md) - TestSprite ilerleme raporu
- [TestSprite Fixes Progress](./docs/reports/TESTSPRITE_FIXES_PROGRESS.md) - TestSprite düzeltme ilerlemesi

### 🔒 Güvenlik

- [Security Audit Report](./docs/security/security-audit-report-20251007_202150.txt) - Güvenlik denetim raporu

### 📖 Diğer Dokümantasyonlar

- [API Documentation](./docs/api/) - API referansı
- [Testing Guide](./docs/TESTING_GUIDE.md) - Test rehberi
- [TypeScript Config](./docs/TYPESCRIPT_CONFIG.md) - TypeScript konfigürasyonu
- [User Guide](./docs/USER_GUIDE.md) - Kullanıcı rehberi

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### Build Hataları

```bash
# Dependencies temizle
rm -rf node_modules package-lock.json
npm install

# TypeScript hataları
npm run type-check
```

#### Supabase Bağlantı Sorunları

```bash
# Environment variables kontrol et
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Supabase status kontrol et
curl https://status.supabase.com/
```

#### Performance Sorunları

```bash
# Bundle analizi
npm run build:analyze

# Lighthouse audit
npm run lighthouse
```

## 📞 Destek

### İletişim

- **GitHub Issues** - Bug reports ve feature requests
- **GitHub Discussions** - Genel sorular
- **Email** - [your-email@domain.com]

### Acil Durumlar

- **Security Issues** - Hemen bildirin
- **Production Issues** - GitHub Issues'da "urgent" label'ı

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE)
dosyasına bakın.

## 🙏 Teşekkürler

- **Supabase** - Backend infrastructure
- **Netlify** - Deployment platform
- **GitHub** - Version control ve CI/CD
- **Open Source Community** - Kullanılan kütüphaneler

---

**Versiyon:** 1.0.0  
**Son Güncelleme:** $(date)  
**Durum:** Production Ready ✅
