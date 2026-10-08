import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from '@untitledui/icons'

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
}: SelectProps<T>) {
  const autoId = useId()
  const buttonId = id ?? `${autoId}-button`
  const listId = `${autoId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typeaheadRef = useRef({ text: '', timer: 0 })

  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  function open() {
    if (disabled) return
    setActiveIndex(Math.max(selectedIndex, 0))
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
  }

  function choose(index: number) {
    const option = options[index]
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

  // Mantiene visible la opción activa al navegar con teclado.
  useEffect(() => {
    if (!isOpen) return
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [isOpen, activeIndex])

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
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
        setActiveIndex((current) => Math.min(options.length - 1, current + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((current) => Math.max(0, current - 1))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
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
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) break
        const state = typeaheadRef.current
        window.clearTimeout(state.timer)
        state.text += event.key.toLowerCase()
        state.timer = window.setTimeout(() => (state.text = ''), 600)
        const match = options.findIndex((option) => option.label.toLowerCase().startsWith(state.text))
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
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute top-full right-0 left-0 z-30 mt-1.5 max-h-60 overflow-auto rounded-xl border border-mynted-border bg-mynted-white p-1.5 shadow-lg duration-150 ease-out animate-in fade-in slide-in-from-top-1"
        >
          {options.map((option, index) => {
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
      )}
    </div>
  )
}
