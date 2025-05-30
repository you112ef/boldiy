import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { useSettings } from './lib/hooks/useSettings'; // Added import
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setGlobalHtmlAttributes();

  function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  function setGlobalHtmlAttributes() {
    // Theme
    let theme = localStorage.getItem('bolt_theme');
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);

    // Language and Direction
    // Try reading from 'settings' in localStorage first, then 'bolt_language' cookie
    let lang = 'en'; // Default language
    try {
      const settingsStr = localStorage.getItem('settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings && settings.language) {
          lang = settings.language;
        }
      } else {
        const langCookie = getCookie('bolt_language');
        if (langCookie) {
          lang = langCookie;
        }
      }
    } catch (e) {
      // Fallback to default if localStorage or cookie parsing fails
      console.warn('Could not parse language settings, defaulting to "en".', e);
      lang = 'en';
    }

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);
  // useSettings will still be used to reflect changes and potentially for other settings
  const { settings } = useSettings();
  const lang = settings.language || 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    // This effect will now primarily react to changes from useSettings
    // and ensure consistency if settings are updated after initial load.
    const htmlElement = document.documentElement;
    if (htmlElement) {
      if (htmlElement.getAttribute('data-theme') !== theme) {
        htmlElement.setAttribute('data-theme', theme);
      }
      if (htmlElement.getAttribute('lang') !== lang) {
        htmlElement.setAttribute('lang', lang);
      }
      if (htmlElement.getAttribute('dir') !== dir) {
        htmlElement.setAttribute('dir', dir);
      }
    }
  }, [theme, lang, dir]);

  return (
    <>
      <ClientOnly>{() => <DndProvider backend={HTML5Backend}>{children}</DndProvider>}</ClientOnly>
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

import { logStore } from './lib/stores/logs';

export default function App() {
  const theme = useStore(themeStore);

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
