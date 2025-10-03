import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
// import { visualizer } from 'rollup-plugin-visualizer'; // Temporarily disabled for Netlify deployment
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const hasSentryAuthToken = Boolean(process.env.VITE_SENTRY_AUTH_TOKEN);

if (hasSentryAuthToken) {
  console.log('✅ Sentry plugin enabled with source map upload');
} else {
  console.log('⚠️ Sentry plugin skipped (no auth token)');
}

export default defineConfig({
  esbuild: {
    // Drop console and debugger in production builds (Vite handles modes)
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  css: {
    postcss: './postcss.config.js',
  },
  plugins: [
    react({
      // React plugin optimizasyonları
      include: ['**/*.{jsx,tsx}'],
      exclude: [/node_modules/],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3000000,
        // NavigateFallback must be null for SPAs
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
      },
      manifest: {
        name: 'Dernek Yönetim Sistemi',
        short_name: 'DernekYS',
        description:
          'Kar amacı gütmeyen dernekler için modern, kapsamlı yönetim sistemi. 11 modül ile tam dernek operasyonlarını yönetin.',
        theme_color: '#1e3a8a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'tr',
        dir: 'ltr',
        categories: ['business', 'productivity', 'social'],
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Yardım Başvuruları',
            url: '/#/yardim/basvurular',
            description: 'Yardım başvurularını görüntüle ve yönet',
            icons: [{ src: '/favicon.svg', sizes: 'any' }],
          },
          {
            name: 'Bağış Kaydet',
            url: '/#/bagis/yeni',
            description: 'Yeni bağış kaydı oluştur',
            icons: [{ src: '/favicon.svg', sizes: 'any' }],
          },
          {
            name: 'Üye Listesi',
            url: '/#/uye/liste',
            description: 'Üye listesini görüntüle',
            icons: [{ src: '/favicon.svg', sizes: 'any' }],
          },
          {
            name: 'Dashboard',
            url: '/#/genel',
            description: 'Ana dashboard ve istatistikler',
            icons: [{ src: '/favicon.svg', sizes: 'any' }],
          },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-dashboard.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Ana dashboard görünümü',
          },
          {
            src: '/screenshots/mobile-navigation.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobil navigasyon menüsü',
          },
        ],
        related_applications: [],
        prefer_related_applications: false,
      },
    }),
    // Conditionally include the Sentry plugin with source map uploads when the auth token is available.
    // Hidden source maps are uploaded to Sentry during build and deleted afterward to prevent public exposure.
    ...(hasSentryAuthToken
      ? [
          sentryVitePlugin({
            org: process.env.VITE_SENTRY_ORG,
            project: process.env.VITE_SENTRY_PROJECT,
            authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
            telemetry: false,
            silent: false,
            sourcemaps: {
              assets: ['./dist/**/*.js', './dist/**/*.js.map'],
              ignore: ['node_modules'],
              filesToDeleteAfterUpload: ['./dist/**/*.js.map'],
            },
            release: {
              name: process.env.VITE_SENTRY_RELEASE,
            },
            errorHandler: (err) => {
              console.warn('Sentry source map upload warning:', err);
            },
          }),
        ]
      : []),
    // Temporarily disabled for Netlify deployment
    // visualizer({
    //   filename: 'dist/bundle-analysis.html',
    //   open: false,
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, '.'),
      // React alias'larını geri ekle ama daha güvenli şekilde
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000, // Daha düşük limit
    rollupOptions: {
      output: {
        manualChunks: {
          // Optimize edilmiş chunk stratejisi
          'react-vendor': ['react', 'react-dom'],
          // Radix UI bileşenlerini ayrı chunk'lara böl
          'radix-dialog': ['@radix-ui/react-dialog'],
          'radix-dropdown': ['@radix-ui/react-dropdown-menu'],
          'radix-select': ['@radix-ui/react-select'],
          'radix-popover': ['@radix-ui/react-popover'],
          'radix-tooltip': ['@radix-ui/react-tooltip'],
          'radix-tabs': ['@radix-ui/react-tabs'],
          'radix-accordion': ['@radix-ui/react-accordion'],
          'radix-collapsible': ['@radix-ui/react-collapsible'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils-vendor': [
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'crypto-js',
          ],
          'icons-vendor': ['lucide-react'],
          'motion-vendor': ['motion'],
          'query-vendor': ['@tanstack/react-query'],
        },
        // Daha iyi cache stratejisi
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `js/[name]-[hash:8].js`;
        },
        entryFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const safeName = assetInfo.name || 'asset.bin';
          const info = safeName.split('.');
          const ext = info[info.length - 1] || 'bin';
          if (/\.(css)$/.test(safeName)) {
            return `css/[name]-[hash:8].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(safeName)) {
            return `img/[name]-[hash:8].${ext}`;
          }
          return `assets/[name]-[hash:8].${ext}`;
        },
      },
      external: (id) => {
        // External olarak işaretlenecek modüller
        return ['virtual:pwa-register'].includes(id);
      },
    },
    // 'hidden' generates source maps without referencing them in built assets, allowing Sentry to consume them securely.
    // Unlike `true`, hidden source maps are not publicly exposed and are cleaned up after upload.
    sourcemap: 'hidden',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 5, // Daha fazla optimizasyon
        unsafe: false,
        // Daha agresif optimizasyonlar
        pure_funcs: [
          'console.log',
          'console.info',
          'console.debug',
          'console.warn',
          'console.error',
        ],
        dead_code: true,
        unused: true,
        evaluate: true,
        reduce_vars: true,
        collapse_vars: true,
        hoist_funs: true,
        hoist_vars: true,
        if_return: true,
        join_vars: true,
        side_effects: false,
        // Remove all React DevTools related code
        toplevel: true,
        module: true,
      },
      mangle: {
        safari10: true,
        // Daha iyi mangle stratejisi
        properties: {
          regex: /^_/,
        },
      },
      format: {
        comments: false,
        // Daha kompakt output
        beautify: false,
        ecma: 2020,
      },
    },
    // Daha hızlı build
    reportCompressedSize: false,
    // CSS optimizasyonu
    cssCodeSplit: true,
    // Chunk size limits
    assetsInlineLimit: 4096, // 4KB limit for inlining assets
  },
  server: {
    port: 5173,
    open: true,
  },
});
