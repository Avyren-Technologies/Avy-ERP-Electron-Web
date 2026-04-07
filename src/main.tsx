import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import faviconUrl from '@/assets/logo/app-logo.png'
import './index.css'
import App from './App.tsx'
import { APIProvider } from './lib/api/provider.tsx'
import { hydrateAuth, initCrossTabSync } from './store/useAuthStore.ts'
import { initTheme } from './store/useThemeStore.ts'

hydrateAuth()
initTheme()
initCrossTabSync()

{
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    document.head.appendChild(link)
  }
  link.href = faviconUrl
}

// Lazy-load Vercel telemetry — not needed at initial render
const Analytics = lazy(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })))
const SpeedInsights = lazy(() => import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights })))

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <APIProvider>
      <App />
      <Suspense fallback={null}>
        <Analytics />
        <SpeedInsights />
      </Suspense>
    </APIProvider>
  </BrowserRouter>,
)
