import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin to process HTML includes
 * Replaces <!-- include: navigation -->, <!-- include: footer -->, <!-- include: hero -->,
 * <!-- include: analytics -->, <!-- include: fundamentals-grid -->, and <!-- include: implementations-grid --> with components
 * and adjusts relative paths based on file depth.
 * Options.repoBaseUrl is used to replace {{repoBaseUrl}} (e.g. for og:image, raw GitHub links).
 */
export function htmlInclude(options = {}) {
  const repoBaseUrl = options.repoBaseUrl ?? ''
  const navigationPath = resolve(__dirname, 'app/components/navigation.html');
  const footerPath = resolve(__dirname, 'app/components/footer.html');
  const heroPath = resolve(__dirname, 'app/components/hero.html');
  const analyticsPath = resolve(__dirname, 'app/components/analytics.html');
  const fundamentalsGridPath = resolve(__dirname, 'app/components/fundamentals-grid.html');
  const implementationsGridPath = resolve(__dirname, 'app/components/implementations-grid.html');
  const releasePleaseManifestPath = resolve(__dirname, '.release-please-manifest.json');

  if (!existsSync(navigationPath)) {
    throw new Error(`Navigation component not found at ${navigationPath}`);
  }

  if (!existsSync(footerPath)) {
    throw new Error(`Footer component not found at ${footerPath}`);
  }

  if (!existsSync(heroPath)) {
    throw new Error(`Hero component not found at ${heroPath}`);
  }

  if (!existsSync(analyticsPath)) {
    throw new Error(`Analytics component not found at ${analyticsPath}`);
  }

  if (!existsSync(fundamentalsGridPath)) {
    throw new Error(`Fundamentals grid component not found at ${fundamentalsGridPath}`);
  }

  if (!existsSync(implementationsGridPath)) {
    throw new Error(`Implementations grid component not found at ${implementationsGridPath}`);
  }

  // Read version from .release-please-manifest.json
  let version = 'unknown';
  if (existsSync(releasePleaseManifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(releasePleaseManifestPath, 'utf-8'));
      version = manifest['.'] || 'unknown';
    } catch (e) {
      console.warn(`⚠ Failed to read version from .release-please-manifest.json: ${e.message}`);
    }
  }

  const navigationTemplate = readFileSync(navigationPath, 'utf-8');
  const footerTemplate = readFileSync(footerPath, 'utf-8');
  const heroTemplate = readFileSync(heroPath, 'utf-8');
  const analyticsTemplate = readFileSync(analyticsPath, 'utf-8');
  const fundamentalsGridTemplate = readFileSync(fundamentalsGridPath, 'utf-8');
  const implementationsGridTemplate = readFileSync(implementationsGridPath, 'utf-8');

  return {
    name: 'html-include',
    enforce: 'pre',
    transformIndexHtml(html, context) {
      // Check if any includes are present
      const hasNavigation = html.includes('<!-- include: navigation -->');
      const hasFooter = html.includes('<!-- include: footer -->');
      const hasHero = html.includes('<!-- include: hero -->');
      const hasAnalytics = html.includes('<!-- include: analytics -->');
      const hasFundamentalsGrid = html.includes('<!-- include: fundamentals-grid -->');
      const hasImplementationsGrid = html.includes('<!-- include: implementations-grid -->');

      // Get the file path - try different context properties (needed for basePath even when no includes)
      const filePath = context.filename || context.path || '';
      const appDir = resolve(__dirname, 'app');

      // Normalize path and get relative path
      let relativePath = '';
      if (filePath) {
        try {
          relativePath = relative(appDir, filePath);
        } catch (e) {
          const match = filePath.match(/app[\\/](.+)$/);
          if (match) {
            relativePath = match[1];
          }
        }
      }

      // Fallback: try to determine from HTML content or use empty string
      if (!relativePath) {
        const manifestMatch = html.match(/href=["']([^"']*manifest\.json)["']/);
        if (manifestMatch) {
          const manifestPath = manifestMatch[1];
          if (manifestPath === 'manifest.json') {
            relativePath = 'index.html';
          } else if (manifestPath === '../manifest.json') {
            relativePath = 'fundamentals/index.html';
          } else if (manifestPath.includes('../')) {
            const depth = (manifestPath.match(/\.\.\//g) || []).length;
            if (depth === 1) {
              relativePath = 'fundamentals/index.html';
            }
          }
        }
      }

      // Calculate base path (how many ../ needed)
      const depth = relativePath ? relativePath.split(/[\\/]/).length - 1 : 0;
      const basePath = depth > 0 ? '../'.repeat(depth) : '';

      if (!hasNavigation && !hasFooter && !hasHero && !hasAnalytics && !hasFundamentalsGrid && !hasImplementationsGrid) {
        return html.replace(/\{\{basePath\}\}/g, basePath).replace(/\{\{repoBaseUrl\}\}/g, repoBaseUrl);
      }

      // Determine active page based on file path
      const activeStates = determineActiveStates(relativePath || 'index.html');
      
      // Replace placeholders in navigation template
      let navigation = navigationTemplate;
      navigation = navigation.replace(/\{\{basePath\}\}/g, basePath);
      
      // Replace active state placeholders
      Object.entries(activeStates).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        navigation = navigation.replace(new RegExp(escapedPlaceholder, 'g'), value ? 'active' : '');
      });
      
      // Replace navigation include if present
      if (hasNavigation) {
        html = html.replace('<!-- include: navigation -->', navigation);
      }
      
      // Replace footer include if present
      if (hasFooter) {
        let footer = footerTemplate;
        footer = footer.replace(/\{\{basePath\}\}/g, basePath);
        footer = footer.replace(/\{\{version\}\}/g, version);
        // Calculate changelog path based on basePath
        const changelogPath = `${basePath}CHANGELOG.md`;
        footer = footer.replace(/\{\{changelogPath\}\}/g, changelogPath);
        html = html.replace('<!-- include: footer -->', footer);
      }

      // Replace hero include if present
      if (hasHero) {
        const heroContent = getHeroContent(relativePath || 'index.html');
        let hero = heroTemplate;
        hero = hero.replace(/\{\{basePath\}\}/g, basePath);
        hero = hero.replace(/\{\{heroTitle\}\}/g, heroContent.heroTitle);
        hero = hero.replace(/\{\{heroSubtitle\}\}/g, heroContent.heroSubtitle);
        hero = hero.replace(/\{\{heroExtras\}\}/g, heroContent.heroExtras);
        html = html.replace('<!-- include: hero -->', hero);
      }

      // Replace analytics include if present
      if (hasAnalytics) {
        html = html.replace('<!-- include: analytics -->', analyticsTemplate);
      }
      
      // Replace fundamentals-grid include if present
      if (hasFundamentalsGrid) {
        let fundamentalsGrid = fundamentalsGridTemplate;
        fundamentalsGrid = fundamentalsGrid.replace(/\{\{basePath\}\}/g, basePath);
        html = html.replace('<!-- include: fundamentals-grid -->', fundamentalsGrid);
      }
      
      // Replace implementations-grid include if present
      if (hasImplementationsGrid) {
        let implementationsGrid = implementationsGridTemplate;
        implementationsGrid = implementationsGrid.replace(/\{\{basePath\}\}/g, basePath);
        html = html.replace('<!-- include: implementations-grid -->', implementationsGrid);
      }

      // Replace {{basePath}} and {{repoBaseUrl}} everywhere (head links, img src, a href, og:image, etc.)
      html = html.replace(/\{\{basePath\}\}/g, basePath).replace(/\{\{repoBaseUrl\}\}/g, repoBaseUrl);

      return html;
    }
  };
}

/**
 * Determine which navigation items should be active based on file path
 */
function determineActiveStates(filePath) {
  const states = {
    activeHome: false,
    activeFundamentals: false,
    activeLogos: false,
    activeBackgrounds: false,
    activeColors: false,
    activeFonts: false,
    activeGuidelines: false,
    activeImplementations: false,
    activeBusinessCards: false,
    activeWebApplications: false,
    activeEmailFooter: false,
    activeAvatars: false,
    activeGithub: false,
    activeLinkedin: false,
    activeImpressum: false
  };

  // Normalize path
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
  
  // Check for home page (only root index.html, not subdirectory index.html)
  if (normalizedPath === 'index.html') {
    states.activeHome = true;
    return states;
  }
  
  // Check for impressum
  if (normalizedPath.includes('impressum.html')) {
    states.activeImpressum = true;
    return states;
  }
  
  // Check for fundamentals
  if (normalizedPath.includes('fundamentals/')) {
    states.activeFundamentals = true;
    
    if (normalizedPath.includes('logos.html')) {
      states.activeLogos = true;
    } else if (normalizedPath.includes('backgrounds.html')) {
      states.activeBackgrounds = true;
    } else if (normalizedPath.includes('colors.html')) {
      states.activeColors = true;
    } else if (normalizedPath.includes('fonts.html')) {
      states.activeFonts = true;
    } else if (normalizedPath.includes('guidelines.html')) {
      states.activeGuidelines = true;
    }
    
    return states;
  }
  
  // Check for implementations
  if (normalizedPath.includes('implementations/')) {
    states.activeImplementations = true;
    
    if (normalizedPath.includes('business-cards.html')) {
      states.activeBusinessCards = true;
    } else if (normalizedPath.includes('web-applications.html')) {
      states.activeWebApplications = true;
    } else if (normalizedPath.includes('email-footer.html')) {
      states.activeEmailFooter = true;
    } else if (normalizedPath.includes('avatars.html')) {
      states.activeAvatars = true;
    } else if (normalizedPath.includes('github.html')) {
      states.activeGithub = true;
    } else if (normalizedPath.includes('linkedin.html')) {
      states.activeLinkedin = true;
    }
    
    return states;
  }
  
  return states;
}

/**
 * Hero content (title, subtitle, extras HTML) per page path
 */
const HERO_INDEX_EXTRAS = `<div class="flex flex-col sm:flex-row gap-4 mb-6" id="hero-cta-buttons">
                <div class="animate-pulse">
                    <p class="font-body text-lg">Loading download information...</p>
                </div>
            </div>

            <!-- What's New Teaser -->
            <div id="whats-new-teaser" class="mb-4">
                <!-- Will be populated by JavaScript -->
            </div>`;

function heroExtrasTags(tagsHtml) {
  return `
            <p class="font-body text-lg md:text-xl mb-4">
                ${tagsHtml}
            </p>

            <!-- Accent line -->
            <div class="hero-accent-line-fuchsia"></div>`;
}

const HERO_CONTENT_MAP = {
  'index.html': {
    heroTitle: 'Corporate Identity & Corporate Design',
    heroSubtitle: 'Alle Brand Assets, Guidelines und Templates auf einen Blick.',
    heroExtras: HERO_INDEX_EXTRAS,
  },
  'impressum.html': {
    heroTitle: 'Impressum',
    heroSubtitle: 'Legal notice and company information',
    heroExtras: heroExtrasTags('<span class="text-fuchsia">Thinkport GmbH</span> • <span class="text-aqua">Frankfurt am Main</span>'),
  },
  'fundamentals/index.html': {
    heroTitle: 'Fundamentals',
    heroSubtitle: 'Brand foundation elements - the building blocks of our identity',
    heroExtras: heroExtrasTags('<span class="text-aqua">Logos</span> • <span class="text-fuchsia">Colors</span> • <span class="text-aqua">Typography</span> • <span class="text-fuchsia">Icons</span>'),
  },
  'fundamentals/logos.html': {
    heroTitle: 'Logos',
    heroSubtitle: 'Offizielle Thinkport-Logovarianten – Horizontal, Icon und Venitus',
    heroExtras: heroExtrasTags('<span class="text-aqua">Horizontal</span> • <span class="text-fuchsia">Icon</span> • <span class="text-aqua">Venitus</span>'),
  },
  'fundamentals/backgrounds.html': {
    heroTitle: 'Hintergrundgrafiken',
    heroSubtitle: 'Alle Hintergrundgrafiken für Hero-Bereiche, 16:9-Visuals, Banner und Webanwendungen – mit direktem SVG-Download.',
    heroExtras: heroExtrasTags('<span class="text-aqua">Standard</span> • <span class="text-fuchsia">16:9</span> • <span class="text-aqua">Banner</span> • <span class="text-fuchsia">Webapp</span>'),
  },
  'fundamentals/colors.html': {
    heroTitle: 'Markenfarben',
    heroSubtitle: 'Primärfarben und Farbharmonien für konsistente Markendarstellung',
    heroExtras: `
            <p class="font-body text-lg md:text-xl mb-4">
                <span style="color: #0B2649; background: rgba(255,255,255,0.2); padding: 0.125rem 0.5rem; border-radius: 0.25rem;">Dark Blue</span> • <span style="color: #0B2649;">Orange</span> • <span style="color: #00BCD4;">Turquoise</span>
            </p>
            <div style="height: 4px; width: 80px; background-color: #00BCD4; margin-top: 0.5rem;"></div>`,
  },
  'fundamentals/fonts.html': {
    heroTitle: 'Typography',
    heroSubtitle: 'Brand fonts and typography guidelines - type that conveys personality and brings content to life',
    heroExtras: heroExtrasTags('<span class="text-fuchsia">Hanken Grotesk</span> • <span class="text-aqua">Source Sans 3</span>'),
  },
  'fundamentals/icons.html': {
    heroTitle: 'Icons',
    heroSubtitle: 'Visual symbols that communicate instantly - icons that guide, inform, and enhance user experience',
    heroExtras: heroExtrasTags('<span class="text-aqua">Tabler Icons</span> • <span class="text-fuchsia">Brand Icons</span> • <span class="text-aqua">UI Elements</span>'),
  },
  'fundamentals/guidelines.html': {
    heroTitle: 'Guidelines',
    heroSubtitle: 'Design-Richtlinien für konsistente Markendarstellung',
    heroExtras: heroExtrasTags('<span class="text-aqua">Logo Usage</span> • <span class="text-fuchsia">Color Palette</span> • <span class="text-aqua">Typography</span>').replace('hero-accent-line-fuchsia', 'hero-accent-line'),
  },
  'implementations/index.html': {
    heroTitle: 'Implementations',
    heroSubtitle: 'Products and implementations created from brand fundamentals',
    heroExtras: heroExtrasTags('<span class="text-fuchsia">Business Cards</span> • <span class="text-aqua">Web Applications</span> • <span class="text-fuchsia">Email Footer</span> • <span class="text-aqua">Avatars</span> • <span class="text-fuchsia">LinkedIn</span>'),
  },
  'implementations/avatars.html': {
    heroTitle: 'Avatars',
    heroSubtitle: 'Square avatar graphics with cut-out portraits and Abstract 5 background',
    heroExtras: heroExtrasTags('<span class="text-aqua">Square Format</span> • <span class="text-fuchsia">Brand Colors</span> • <span class="text-aqua">Cut-out Portraits</span>'),
  },
  'implementations/business-cards.html': {
    heroTitle: 'Business Cards',
    heroSubtitle: 'Professional business cards with QR code integration',
    heroExtras: heroExtrasTags('<span class="text-fuchsia">Brand Guidelines</span> • <span class="text-aqua">QR Code</span> • <span class="text-fuchsia">vCard Integration</span>'),
  },
  'implementations/email-footer.html': {
    heroTitle: 'Email Footer',
    heroSubtitle: 'Professional email footer templates following brand guidelines',
    heroExtras: heroExtrasTags('<span class="text-fuchsia">Brand Guidelines</span> • <span class="text-aqua">Email Compatible</span> • <span class="text-fuchsia">Responsive Design</span>'),
  },
  'implementations/github.html': {
    heroTitle: 'GitHub Assets',
    heroSubtitle: 'README Header, Template und Social Preview für kieks.me Repositories',
    heroExtras: heroExtrasTags('<span class="text-aqua">README Header</span> • <span class="text-fuchsia">Template</span> • <span class="text-aqua">Social Preview</span>'),
  },
  'implementations/linkedin.html': {
    heroTitle: 'LinkedIn Images',
    heroSubtitle: 'LinkedIn-compliant images for company pages and career pages',
    heroExtras: heroExtrasTags('<span class="text-aqua">Company Pages</span> • <span class="text-fuchsia">Career Pages</span> • <span class="text-aqua">Brand Colors</span>'),
  },
  'implementations/web-applications.html': {
    heroTitle: 'Web Applications',
    heroSubtitle: 'Tailwind CSS und Vite Anleitungen für moderne Webanwendungen',
    heroExtras: heroExtrasTags('<span class="text-aqua">Tailwind CSS</span> • <span class="text-fuchsia">Vite</span> • <span class="text-aqua">Components</span>'),
  },
};

function getHeroContent(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const entry = HERO_CONTENT_MAP[normalized];
  if (entry) return entry;
  return {
    heroTitle: 'Thinkport GmbH',
    heroSubtitle: 'Corporate Identity & Corporate Design',
    heroExtras: heroExtrasTags('<span class="text-aqua">Brand</span> • <span class="text-fuchsia">Guidelines</span>'),
  };
}
