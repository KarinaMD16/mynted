import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Paperclip, SendHorizontal } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { CHAT_IMAGE_ACCEPT, CHAT_TEXT_MAX_LENGTH } from '../models/chat'
import type { ChatImageError } from '../utils/chatValidation'

/** A partir de cuántos caracteres se muestra el contador. */
const COUNTER_FROM = CHAT_TEXT_MAX_LENGTH - 200
const MAX_TEXTAREA_PX = 140

interface ChatComposerProps {
  /** Devuelve false si el texto no se envió (vacío o demasiado largo). */
  onSendText: (text: string) => boolean
  /** Devuelve el error de validación de la imagen, o null si se está enviando. */
  onSendImage: (file: File) => ChatImageError | null
  autoFocus?: boolean
  /**
   * Respuestas rápidas que se muestran encima de la caja (al empezar un chat). Al tocar
   * una, el texto queda en la caja para editarlo o enviarlo; no se envía solo.
   */
  suggestions?: string[]
}

const IMAGE_ERROR_KEY = {
  invalidType: 'chat.composer.imageInvalidType',
  tooLarge: 'chat.composer.imageTooLarge',
} as const

/**
 * Caja para escribir: adjuntar imagen, texto que crece hasta unas líneas y
 * enviar. Enter envía y Mayús + Enter hace un salto de línea (salvo mientras
 * se compone con un IME, p. ej. coreano). Los límites son los del backend.
 */
export function ChatComposer({ onSendText, onSendImage, autoFocus = false, suggestions }: ChatComposerProps) {
  const { t } = useLanguage()
  const hintId = useId()
  const errorId = useId()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const trimmedLength = text.trim().length
  const tooLong = trimmedLength > CHAT_TEXT_MAX_LENGTH
  const canSend = trimmedLength > 0 && !tooLong

  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`
  }

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!canSend) return
    if (onSendText(text)) {
      setText('')
      setError(null)
      requestAnimationFrame(() => {
        resize()
        textareaRef.current?.focus()
      })
    }
  }

  function applySuggestion(suggestion: string) {
    setText(suggestion)
    setError(null)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      resize()
      el.focus()
      el.setSelectionRange(suggestion.length, suggestion.length)
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    const invalid = onSendImage(file)
    setError(invalid ? t(IMAGE_ERROR_KEY[invalid]) : null)
    // Permite volver a elegir el mismo archivo.
    if (fileRef.current) fileRef.current.value = ''
  }

  const message = error ?? (tooLong ? t('chat.composer.tooLong', { max: CHAT_TEXT_MAX_LENGTH }) : null)

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-1.5 border-t border-mynted-border bg-white px-3 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] sm:px-4"
    >
      {suggestions && suggestions.length > 0 && (
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:-mx-4 sm:px-4 [&::-webkit-scrollbar]:hidden">
          <span className="sr-only">{t('chat.suggestions.label')}</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => applySuggestion(suggestion)}
              className="shrink-0 cursor-pointer rounded-[10px] border border-mynted-border bg-white px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-mynted-ink outline-none transition-colors hover:border-mynted-orange hover:bg-[#fff1ea] focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={CHAT_IMAGE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={t('chat.composer.attach')}
          title={t('chat.composer.attach')}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-mynted-bg text-mynted-ink outline-none transition-colors hover:bg-mynted-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
        >
          <Paperclip className="size-[18px]" aria-hidden="true" />
        </button>

        <label className="sr-only" htmlFor={`${hintId}-input`}>
          {t('chat.composer.placeholder')}
        </label>
        <textarea
          id={`${hintId}-input`}
          ref={textareaRef}
          rows={1}
          value={text}
          autoFocus={autoFocus}
          placeholder={t('chat.composer.placeholder')}
          aria-describedby={message ? `${hintId} ${errorId}` : hintId}
          aria-invalid={tooLong || undefined}
          onChange={(event) => {
            setText(event.target.value)
            if (error) setError(null)
            resize()
          }}
          onKeyDown={handleKeyDown}
          className="max-h-[140px] min-h-10 flex-1 resize-none rounded-xl border border-transparent bg-mynted-bg px-4 py-[9px] text-[14px] leading-[1.45] text-mynted-ink outline-none placeholder:text-mynted-gray-light focus:border-mynted-blue-mid focus:bg-white"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label={t('chat.composer.send')}
          title={t('chat.composer.send')}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-mynted-orange text-mynted-ink shadow-[0_4px_10px_-2px_rgba(253,133,82,0.4)] outline-none transition-colors hover:bg-mynted-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <SendHorizontal className="size-[18px]" aria-hidden="true" />
        </button>
      </div>

      <p id={hintId} className="sr-only">
        {t('chat.composer.hint')}
      </p>
      {(message || trimmedLength >= COUNTER_FROM) && (
        <div className="flex items-center justify-between gap-3 px-1 text-[11px]">
          <span id={errorId} role={message ? 'alert' : undefined} className="text-[#c62a2f]">
            {message}
          </span>
          {trimmedLength >= COUNTER_FROM && (
            <span className={cx('tabular-nums', tooLong ? 'font-semibold text-[#c62a2f]' : 'text-mynted-gray')}>
              {trimmedLength}/{CHAT_TEXT_MAX_LENGTH}
            </span>
          )}
        </div>
      )}
    </form>
  )
}
