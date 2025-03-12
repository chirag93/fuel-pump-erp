
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { Toaster } from '@/components/ui/toaster'

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Failed to find the root element")
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
      <Toaster />
    </StrictMode>
  )
} catch (error) {
  console.error("Error rendering application:", error)
}
