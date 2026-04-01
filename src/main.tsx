import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.tsx'
import { APIProvider } from './lib/api/provider.tsx'
import { hydrateAuth, initCrossTabSync } from './store/useAuthStore.ts'
import { initTheme } from './store/useThemeStore.ts'

hydrateAuth()
initTheme()
initCrossTabSync()

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
