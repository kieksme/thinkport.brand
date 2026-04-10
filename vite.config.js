import { defineConfig, loadEnv } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync, cpSync, existsSync, createReadStream, readFileSync, statSync, writeFileSync } from 'fs'
import tailwindcss from '@tailwindcss/vite'
import { htmlInclude } from './vite-plugin-html-include.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Base URL for raw GitHub repo assets (og:image, sitemaps, links). Change repo/branch here. */
const REPO_BASE_URL = 'https://raw.githubusercontent.com/kieksme/thinkport.brand/main'
/** Base path for app assets/routing. Override via VITE_BASE_PATH in CI for GitHub Pages repo deployments. */
const APP_BASE_PATH = process.env.VITE_BASE_PATH || '/'
/** Brand theme color (primary dark blue) for meta theme-color and manifest. Must be a hex color. */
const THEME_COLOR = '#0B2649'

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown',
}

// Serve ./examples at /examples in dev (examples folder is outside Vite root)
function serveExamplesPlugin() {
  const examplesDir = resolve(__dirname, 'examples')
  return {
    name: 'serve-examples',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/examples/')) return next()
        const pathname = req.url.replace(/\?.*$/, '')
        const filePath = resolve(__dirname, pathname.slice(1))
        if (!filePath.startsWith(examplesDir)) return next()
        try {
          const stat = statSync(filePath)
          if (!stat.isFile()) return next()
          const ext = pathname.slice(pathname.lastIndexOf('.'))
          const contentType = MIME_TYPES[ext] || 'application/octet-stream'
          res.setHeader('Content-Type', contentType)
          createReadStream(filePath).pipe(res)
        } catch {
          next()
        }
      })
    },
  }
}

// Plugin to copy manifest.json, sitemap.xml, and CHANGELOG.md to dist root
const copyRootFilesPlugin = ({ repoBaseUrl, themeColor }) => {
  return {
    name: 'copy-root-files',
    closeBundle() {
      const appFilesToCopy = ['manifest.json', 'sitemap.xml']
      const appFilesWithReplace = ['sitemap.xml', 'manifest.json']
      const rootFilesToCopy = ['CHANGELOG.md', 'NETLIFY.md']
      const appDir = resolve(__dirname, 'app')
      const assetsDir = resolve(__dirname, 'assets')
      const rootDir = __dirname
      const distDir = resolve(__dirname, 'dist')

      // Copy files from app directory (sitemap.xml: read → replace {{repoBaseUrl}} → write)
      appFilesToCopy.forEach((file) => {
        const src = resolve(appDir, file)
        const dest = resolve(distDir, file)
        
        if (existsSync(src)) {
          if (appFilesWithReplace.includes(file)) {
            let content = readFileSync(src, 'utf-8').replace(/\{\{repoBaseUrl\}\}/g, repoBaseUrl)
            if (themeColor) content = content.replace(/\{\{themeColor\}\}/g, themeColor)
            writeFileSync(dest, content)
          } else {
            copyFileSync(src, dest)
          }
          console.log(`✓ Copied ${file} to dist root`)
        } else {
          console.warn(`⚠ ${file} not found in app directory`)
        }
      })

      // Copy assets/sitemap.xml with {{repoBaseUrl}} replacement to dist
      const assetsSitemapSrc = resolve(assetsDir, 'sitemap.xml')
      const assetsSitemapDest = resolve(distDir, 'sitemap-assets.xml')
      if (existsSync(assetsSitemapSrc)) {
        const content = readFileSync(assetsSitemapSrc, 'utf-8').replace(/\{\{repoBaseUrl\}\}/g, repoBaseUrl)
        writeFileSync(assetsSitemapDest, content)
        console.log('✓ Copied assets/sitemap.xml to dist as sitemap-assets.xml')
      }

      // Copy files from root directory
      rootFilesToCopy.forEach((file) => {
        const src = resolve(rootDir, file)
        const dest = resolve(distDir, file)
        
        if (existsSync(src)) {
          copyFileSync(src, dest)
          console.log(`✓ Copied ${file} to dist root`)
        } else {
          console.warn(`⚠ ${file} not found in root directory`)
        }
      })

      // Copy examples folder to dist so avatar/github examples are available in production
      const examplesSrc = resolve(rootDir, 'examples')
      const examplesDest = resolve(distDir, 'examples')
      if (existsSync(examplesSrc)) {
        cpSync(examplesSrc, examplesDest, { recursive: true })
        console.log('✓ Copied examples/ to dist')
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const refsUser = env.THINKPORT_API_USERNAME || ''
  const refsPass = env.THINKPORT_API_PASSWORD || ''

  /**
   * Dev proxy to Thinkport API: forward Basic Auth from the browser when set (e.g. reference images fetch);
   * otherwise inject credentials from .env so `<img>` to the proxy still works when only .env is configured.
   */
  const configureThinkportApiProxy = (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      if (proxyReq.getHeader('authorization')) return
      if (refsUser && refsPass) {
        const token = Buffer.from(`${refsUser}:${refsPass}`, 'utf8').toString('base64')
        proxyReq.setHeader('Authorization', `Basic ${token}`)
      }
    })
  }

  return {
    base: APP_BASE_PATH,
    root: resolve(__dirname, 'app'),
  server: {
    proxy: {
      // Thinkport API (GraphQL: references, data, … + static assets under /images, …).
      '/api/thinkport': {
        target: 'https://thinkportapi.netlify.app',
        changeOrigin: true,
        rewrite: (path) => {
          const next = path.replace(/^\/api\/thinkport/, '') || '/'
          return next.startsWith('/') ? next : `/${next}`
        },
        configure: configureThinkportApiProxy,
      },
    },
  },
  plugins: [
    htmlInclude({
      repoBaseUrl: REPO_BASE_URL,
      themeColor: THEME_COLOR,
      swetrixProjectId: process.env.VITE_SWETRIX_PROJECT_ID || 'MU8JYS8kagYf',
    }),
    serveExamplesPlugin(),
    tailwindcss(),
    copyRootFilesPlugin({ repoBaseUrl: REPO_BASE_URL, themeColor: THEME_COLOR }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'app/index.html'),
        'fundamentals/index': resolve(__dirname, 'app/fundamentals/index.html'),
        'fundamentals/logos': resolve(__dirname, 'app/fundamentals/logos.html'),
        'fundamentals/backgrounds': resolve(__dirname, 'app/fundamentals/backgrounds.html'),
        'fundamentals/colors': resolve(__dirname, 'app/fundamentals/colors.html'),
        'fundamentals/fonts': resolve(__dirname, 'app/fundamentals/fonts.html'),
        'fundamentals/icons': resolve(__dirname, 'app/fundamentals/icons.html'),
        'fundamentals/guidelines': resolve(__dirname, 'app/fundamentals/guidelines.html'),
        'implementations/index': resolve(__dirname, 'app/implementations/index.html'),
        'implementations/business-cards': resolve(__dirname, 'app/implementations/business-cards.html'),
        'implementations/web-applications': resolve(__dirname, 'app/implementations/web-applications.html'),
        'implementations/email-footer': resolve(__dirname, 'app/implementations/email-footer.html'),
        'implementations/avatars': resolve(__dirname, 'app/implementations/avatars.html'),
        'implementations/github': resolve(__dirname, 'app/implementations/github.html'),
        'implementations/linkedin': resolve(__dirname, 'app/implementations/linkedin.html'),
        'implementations/letterhead': resolve(__dirname, 'app/implementations/letterhead.html'),
        'implementations/ios-posters': resolve(__dirname, 'app/implementations/ios-posters.html'),
        'implementations/portfolio-pdf': resolve(__dirname, 'app/implementations/portfolio-pdf.html'),
        'implementations/teams': resolve(__dirname, 'app/implementations/teams.html'),
        'implementations/powerpoint-templates': resolve(__dirname, 'app/implementations/powerpoint-templates.html'),
        impressum: resolve(__dirname, 'app/impressum.html'),
        'google920fd9ad773da353': resolve(__dirname, 'app/google920fd9ad773da353.html'),
        'implementations/references-pdf': resolve(__dirname, 'app/implementations/references-pdf.html'),
      },
    },
  },
  publicDir: resolve(__dirname, 'assets'),
  }
})
