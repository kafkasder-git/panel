# 🔧 Netlify Lighthouse Plugin Hatası - Çözüm

## ❌ Problem

Netlify deployment sırasında şu hata alınıyor:

```
Failed during stage 'building site': Build script returned non-zero exit code: 2
Installing plugins
  - @netlify/plugin-lighthouse@6.0.1
"You are not permitted to use this feature. Sorry."
```

## 🎯 Root Cause

**@netlify/plugin-lighthouse** plugin'i **Netlify Pro plan** gerektirir ve Free
plan'da çalışmaz.

## ✅ Çözüm Adımları

### 1. Netlify Dashboard'da Plugin'i Kaldır

1. [Netlify Dashboard](https://app.netlify.com/projects/elaborate-semifreddo-5d54d0)
   → **Plugins** sekmesine git
2. **@netlify/plugin-lighthouse** plugin'ini bul
3. **Remove** veya **Disable** butonuna tıkla
4. Değişiklikleri kaydet

### 2. Alternatif Performance Monitoring

Lighthouse plugin'i yerine şu alternatifleri kullanabilirsiniz:

#### A. Chrome DevTools Lighthouse

```bash
# Local'de test etmek için:
npm run build
npm run preview
# Chrome DevTools → Lighthouse → Generate report
```

#### B. Netlify Analytics (Opsiyonel)

- Netlify Dashboard → **Analytics** → **Enable**
- Gerçek zamanlı performans metrikleri
- Free plan'da sınırlı

#### C. Web Vitals Monitoring

```javascript
// Kendi performance monitoring kodunuzu ekleyebilirsiniz
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 3. Local Lighthouse Testing

Projenizi local'de test etmek için:

```bash
# Build ve preview
npm run build
npm run preview

# Başka bir terminal'de
npx lighthouse http://localhost:4173 --output html --output-path ./lighthouse-report.html
```

### 4. CI/CD Pipeline'da Lighthouse (Opsiyonel)

GitHub Actions ile Lighthouse test'i ekleyebilirsiniz:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push, pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Run Lighthouse
        run: npx lighthouse-ci autorun
```

## 🎯 Deployment Sonrası

Plugin kaldırıldıktan sonra:

1. **Redeploy** tetikleyin (Netlify Dashboard → Deploys → Trigger Deploy)
2. Build başarılı olacak
3. Site erişilebilir olacak

## 📊 Performance Hedefleri

Lighthouse plugin'i olmadan da bu metrikleri takip edebilirsiniz:

- **Performance:** 90+ (Core Web Vitals)
- **Accessibility:** 90+
- **Best Practices:** 90+
- **SEO:** 90+
- **PWA:** 80+

## 🔗 Yararlı Linkler

- [Netlify Plugin Docs](https://docs.netlify.com/plugins/overview/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)
- [Netlify Analytics](https://docs.netlify.com/analytics/)

## ✅ Sonuç

Lighthouse plugin'i kaldırıldıktan sonra deployment başarılı olacak ve site
production'da çalışacak. Performance monitoring için alternatif çözümler mevcut.

---

**Son Güncelleme:** 2025-10-03  
**Durum:** Çözüm hazır, Netlify Dashboard'da plugin kaldırılmalı
