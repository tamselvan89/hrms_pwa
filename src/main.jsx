import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext.jsx'
import { App } from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)

// Register SW in both dev and prod — required for beforeinstallprompt on Android
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/punch/sw.js', { scope: '/punch/' })
      .then(reg => console.debug('[SW] registered', reg.scope))
      .catch(err => console.warn('[SW] registration failed', err))
  })
}
