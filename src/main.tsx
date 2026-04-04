import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <APIProvider>
        <App />
        <Analytics />
        <SpeedInsights />
      </APIProvider>
    </BrowserRouter>
  </StrictMode>,
)
