import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/auth'
import { WalletProvider } from './context/wallet'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <WalletProvider>
          <App />
          <Toaster position="top-right" />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
