import { useCallback, useEffect, useState } from 'react'

interface CookieOptions {
  days?: number
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
  path?: string
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return
  const { days = 365, sameSite = 'lax', secure = true, path = '/' } = options
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `expires=${expires}`,
    `path=${path}`,
    `SameSite=${sameSite}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

function eraseCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
}

export function useCookie<T>(
  name: string,
  defaultValue: T,
  options: CookieOptions = {},
): [T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = readCookie(name)
    if (raw === null) return defaultValue
    try {
      return JSON.parse(raw) as T
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    const raw = readCookie(name)
    if (raw === null) return
    try {
      setValue(JSON.parse(raw) as T)
    } catch {
      // cookie corrupta: se ignora y se mantiene el valor por defecto
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = useCallback(
    (next: T) => {
      setValue(next)
      writeCookie(name, JSON.stringify(next), options)
    },
    [name, options],
  )

  const remove = useCallback(() => {
    eraseCookie(name)
    setValue(defaultValue)
  }, [name, defaultValue])

  return [value, update, remove]
}
