import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getHttpStatus } from './api/apiError'
import './index.css'
import { router } from './router'
import './styles/globals.css'

/** Reintentos de React Query, menos los tres por defecto en errores que no se arreglan solos. */
const MAX_RETRIES = 3

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Un 4xx no cambia por insistir: la publicación es privada, no existe o
       * no hay sesión. Reintentarlo solo hace esperar al usuario — en un 403 la
       * pantalla tardaba unos 15 segundos en explicar qué pasó. Se reintenta lo
       * que sí puede ser pasajero: red caída y errores del servidor.
       */
      retry: (failureCount, error) => {
        const status = getHttpStatus(error)
        if (status !== undefined && status >= 400 && status < 500) return false
        return failureCount < MAX_RETRIES
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
