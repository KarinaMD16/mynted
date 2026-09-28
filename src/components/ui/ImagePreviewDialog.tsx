import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from './dialog'

interface ImagePreviewDialogProps {
  /** URL de la imagen a mostrar; si es null el diálogo no abre. */
  src: string | null
  alt: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export function ImagePreviewDialog({ src, alt, title, isOpen, onClose }: ImagePreviewDialogProps) {
  const { t } = useLanguage()

  if (!src) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/80" />
        <DialogPrimitive.Content
          className="fixed top-[50%] left-[50%] z-50 w-[calc(100%-2rem)] max-w-4xl translate-x-[-50%] translate-y-[-50%] outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>

          <img src={src} alt={alt} className="mx-auto max-h-[85vh] w-auto max-w-full rounded-xl object-contain" />

          <DialogPrimitive.Close
            aria-label={t('imagePreview.close')}
            className="absolute -top-2 right-0 rounded-full bg-black/60 p-2 text-white outline-none transition-colors hover:cursor-pointer hover:bg-black/80 sm:-top-12"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
