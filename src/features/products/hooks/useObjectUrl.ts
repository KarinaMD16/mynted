import { useEffect, useState } from 'react'

/**
 * Vista previa de un archivo local como data URL. Se lee con FileReader (y no
 * con URL.createObjectURL + revoke en un efecto) para que el ciclo
 * montar/desmontar de StrictMode no deje la imagen apuntando a una URL ya
 * revocada. Las imágenes pesan como máximo 5 MB, así que no es un problema.
 */
export function useObjectUrl(file: File | null) {
  const [entry, setEntry] = useState<{ file: File; url: string } | null>(null)
  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setEntry({ file, url: reader.result })
    }
    reader.readAsDataURL(file)
    return () => reader.abort()
  }, [file])
  return file && entry?.file === file ? entry.url : null
}
