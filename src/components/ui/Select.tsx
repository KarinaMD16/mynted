import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, SearchLg } from '@untitledui/icons'

export interface SelectOption<T extends string | number> {
  value: T
  label: string
}

interface SelectProps<T extends string | number> {
  id?: string
  /** Valor elegido; cualquier valor que no esté en `options` (p. ej. '' o 0) muestra el placeholder. */
  value: T | '' | 0
  options: SelectOption<T>[]
  placeholder: string
  onChange: (value: T) => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  className?: string
  /** Agrega un campo para filtrar las opciones (útil en listas largas, como los países). */
  searchable?: boolean
  searchPlaceholder?: string
  /** Texto cuando el filtro no encuentra nada; `{{query}}` ya viene resuelto. */
  emptyLabel?: (query: string) => string
}

/** Compara sin importar mayúsculas ni tildes ("peru" encuentra "Perú"). */
function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * Selector propio (en vez del <select> nativo, cuya lista no se puede
 * estilizar). La lista se dibuja pegada al botón, dentro del mismo contenedor
 * —no en un portal—, para que funcione dentro de los diálogos de Radix sin
 * pelear con su manejo de foco y clics externos. Soporta teclado
 * (flechas, Inicio/Fin, Enter/Espacio, Esc, letras) y lectores de pantalla.
 */
export function Select<T extends string | number>({
  id,
  value,
  options,
  placeholder,
  onChange,
  onBlur,
  disabled = false,
  invalid = false,
  className = '',
  searchable = false,
  searchPlaceholder = '',
  emptyLabel,
}: SelectProps<T>) {
  const autoId = useId()
  const buttonId = id ?? `${autoId}-button`
  const listId = `${autoId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const typeaheadRef = useRef({ text: '', timer: 0 })

  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const [query, setQuery] = useState('')

  const selected = options.find((option) => option.value === value)
  // Con búsqueda, la lista que se dibuja (y por la que se navega) es la filtrada.
  const visible = useMemo(() => {
    const term = normalize(query.trim())
    return searchable && term ? options.filter((option) => normalize(option.label).includes(term)) : options
  }, [options, query, searchable])
  const selectedIndex = visible.findIndex((option) => option.value === value)

  function open() {
    if (disabled) return
    setQuery('')
    setActiveIndex(Math.max(options.findIndex((option) => option.value === value), 0))
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
  }

  function choose(index: number) {
    const option = visible[index]
    if (!option) return
    onChange(option.value)
    close()
  }

  // Un clic fuera cierra la lista.
  useEffect(() => {
    if (!isOpen) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        onBlur?.()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen, onBlur])

  // Al abrir, el cursor va directo al campo de búsqueda.
  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus()
  }, [isOpen, searchable])

  // Mantiene visible la opción activa al navegar con teclado.
  useEffect(() => {
    if (!isOpen) return
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [isOpen, activeIndex])

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (disabled) return

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        open()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((current) => Math.min(visible.length - 1, current + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((current) => Math.max(0, current - 1))
        break
      case 'Home':
        // En el campo de búsqueda, Inicio/Fin mueven el cursor del texto.
        if (searchable) break
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        if (searchable) break
        event.preventDefault()
        setActiveIndex(visible.length - 1)
        break
      case 'Enter':
        event.preventDefault()
        choose(activeIndex)
        break
      case ' ':
        // El espacio es parte del texto buscado (p. ej. "Costa Rica").
        if (searchable) break
        event.preventDefault()
        choose(activeIndex)
        break
      case 'Escape':
        // No debe llegar al diálogo contenedor, que también se cierra con Esc.
        event.preventDefault()
        event.stopPropagation()
        close()
        break
      case 'Tab':
        close()
        break
      default: {
        if (searchable || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) break
        const state = typeaheadRef.current
        window.clearTimeout(state.timer)
        state.text += event.key.toLowerCase()
        state.timer = window.setTimeout(() => (state.text = ''), 600)
        const match = visible.findIndex((option) => option.label.toLowerCase().startsWith(state.text))
        if (match >= 0) setActiveIndex(match)
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (!isOpen) onBlur?.()
        }}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border bg-white px-3.5 py-2.5 text-left text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isOpen ? 'ring-2 ring-mynted-orange/20' : ''
        } ${
          invalid ? 'border-red-400' : isOpen ? 'border-mynted-orange' : 'border-mynted-border hover:border-mynted-orange/60 focus-visible:border-mynted-orange'
        }`}
      >
        <span className={`truncate ${selected ? 'text-mynted-ink' : 'text-mynted-gray-light'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-mynted-gray transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-mynted-border bg-mynted-white shadow-lg duration-150 ease-out animate-in fade-in slide-in-from-top-1">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-mynted-border px-3 py-2">
              <SearchLg className="size-4 shrink-0 text-mynted-gray" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                role="searchbox"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
                autoComplete="off"
                className="w-full min-w-0 bg-transparent text-sm text-mynted-ink outline-none placeholder:text-mynted-gray-light"
              />
            </div>
          )}
          {searchable && visible.length === 0 && (
            <p className="px-3.5 py-3 text-sm text-mynted-gray" role="status">
              {emptyLabel?.(query.trim()) ?? ''}
            </p>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={buttonId}
            className="max-h-60 overflow-auto p-1.5"
          >
          {visible.map((option, index) => {
            const isSelected = index === selectedIndex
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActiveIndex(index)}
                // mousedown evita que el botón pierda el foco antes de registrar el clic.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  index === activeIndex ? 'bg-mynted-bg' : ''
                } ${isSelected ? 'text-mynted-orange' : 'text-mynted-ink'}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0" aria-hidden="true" />}
              </li>
            )
          })}
          </ul>
        </div>
      )}
    </div>
  )
}
