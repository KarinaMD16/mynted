import { useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Search } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'

export interface AdminColumn<T> {
  id: string
  header: string
  render: (row: T) => ReactNode
  /** Si se pasa, la columna se puede ordenar con el valor que devuelve. */
  sortValue?: (row: T) => string | number
  className?: string
}

interface AdminDataTableProps<T> {
  rows: T[] | undefined
  columns: AdminColumn<T>[]
  getRowId: (row: T) => string | number
  /** Texto en el que busca el campo de búsqueda (nombre, correo, etc.). */
  getSearchText: (row: T) => string
  /** Acciones de la fila (columna "Acción" a la derecha). */
  renderActions?: (row: T) => ReactNode
  /** Filtros extra junto a "Mostrar N entradas" (selects de rol, estado...). */
  toolbar?: ReactNode
  /** Botón principal arriba a la derecha (p. ej. "Nueva categoría"). */
  primaryAction?: ReactNode
  isLoading: boolean
  error: unknown
  onRetry: () => void
  initialSort?: { id: string; direction: 'asc' | 'desc' }
}

const PAGE_SIZES = [8, 16, 32, 64]

/**
 * Tabla del tab "Gestionar", con el formato del mockup de referencia:
 * "Mostrar N entradas" + búsqueda arriba, columnas ordenables, acciones como
 * íconos a la derecha y paginación numerada abajo. Todo el filtrado, orden y
 * paginado es del lado del cliente porque los endpoints de admin del backend
 * (GET /users, GET /categories) devuelven la lista completa.
 */
export function AdminDataTable<T>({
  rows,
  columns,
  getRowId,
  getSearchText,
  renderActions,
  toolbar,
  primaryAction,
  isLoading,
  error,
  onRetry,
  initialSort,
}: AdminDataTableProps<T>) {
  const { t, language } = useLanguage()
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [requestedPage, setPage] = useState(1)
  const [sort, setSort] = useState(initialSort ?? null)

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    const matches = needle
      ? (rows ?? []).filter((row) => getSearchText(row).toLocaleLowerCase().includes(needle))
      : (rows ?? [])

    if (!sort) return matches
    const sortColumn = columns.find((column) => column.id === sort.id)
    if (!sortColumn?.sortValue) return matches

    const collator = new Intl.Collator(language, { numeric: true, sensitivity: 'base' })
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...matches].sort((a, b) => {
      const left = sortColumn.sortValue!(a)
      const right = sortColumn.sortValue!(b)
      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : collator.compare(String(left), String(right))
      return result * factor
    })
  }, [rows, search, sort, columns, getSearchText, language])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  // Si al filtrar (o al cambiar los datos) quedan menos páginas, no quedarse en una vacía.
  const page = Math.min(requestedPage, totalPages)

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, filtered.length)

  function toggleSort(columnId: string) {
    setSort((current) =>
      current?.id === columnId
        ? { id: columnId, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { id: columnId, direction: 'asc' },
    )
  }

  const hasActions = Boolean(renderActions)
  const columnCount = columns.length + (hasActions ? 1 : 0)

  return (
    <div className="rounded-2xl border border-mynted-border bg-white p-4 sm:p-5">
      {/* Barra superior: entradas por página + filtros | búsqueda + acción principal */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-mynted-ink">
            {t('admin.table.show')}
            <select
              value={pageSize}
              aria-label={t('admin.table.pageSizeLabel')}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
              className="h-9 cursor-pointer rounded-lg border border-mynted-border bg-white px-2.5 text-sm outline-none focus-visible:border-mynted-blue-mid"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            {t('admin.table.entries')}
          </label>
          {toolbar}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <label htmlFor={searchId} className="sr-only">
              {t('admin.table.searchLabel')}
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mynted-gray-light"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t('admin.table.searchPlaceholder')}
              className="h-9 w-full rounded-lg border border-mynted-border bg-white pr-3 pl-9 text-sm text-mynted-ink outline-none placeholder:text-mynted-gray-light focus-visible:border-mynted-blue-mid"
            />
          </div>
          {primaryAction}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-mynted-border">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="bg-mynted-bg/60">
            <tr>
              {columns.map((column) => {
                const isSorted = sort?.id === column.id
                const ariaSort = isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={column.sortValue ? ariaSort : undefined}
                    className={`px-4 py-3 text-sm font-medium text-mynted-ink ${column.className ?? ''}`}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.id)}
                        aria-label={t('admin.table.sortBy', { column: column.header })}
                        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
                      >
                        {column.header}
                        <SortIcon state={isSorted ? sort.direction : null} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
              {hasActions && (
                <th scope="col" className="w-px px-4 py-3 text-right text-sm font-medium whitespace-nowrap text-mynted-ink">
                  {t('admin.table.actions')}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: 5 }, (_, index) => (
                <tr key={`skeleton-${index}`} className="border-t border-mynted-border">
                  <td colSpan={columnCount} className="px-4 py-4">
                    <div className="h-8 animate-pulse rounded-lg bg-mynted-bg" />
                  </td>
                </tr>
              ))}

            {!isLoading && Boolean(error) && (
              <tr className="border-t border-mynted-border">
                <td colSpan={columnCount} className="px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-mynted-ink">{t('admin.table.loadError')}</p>
                  <p className="mt-1 text-sm text-mynted-gray">{getApiErrorMessage(error)}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-lg border border-mynted-border bg-white px-4 py-2 text-sm font-semibold text-mynted-ink hover:cursor-pointer hover:bg-mynted-bg"
                  >
                    {t('communities.list.retry')}
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && pageRows.length === 0 && (
              <tr className="border-t border-mynted-border">
                <td colSpan={columnCount} className="px-4 py-12 text-center text-sm text-mynted-gray">
                  {search.trim() ? t('admin.table.noMatches') : t('admin.table.empty')}
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              pageRows.map((row) => (
                <tr key={getRowId(row)} className="border-t border-mynted-border transition-colors hover:bg-mynted-bg/40">
                  {columns.map((column) => (
                    <td key={column.id} className={`px-4 py-3.5 text-sm text-mynted-gray ${column.className ?? ''}`}>
                      {column.render(row)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">{renderActions!(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pie: "Mostrando X a Y de Z entradas" + paginación */}
      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-mynted-ink" aria-live="polite">
          {t('admin.table.showing', {
            from: from.toLocaleString(language),
            to: to.toLocaleString(language),
            total: filtered.length.toLocaleString(language),
          })}
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  )
}

function SortIcon({ state }: { state: 'asc' | 'desc' | null }) {
  const className = 'size-4 shrink-0'
  if (state === 'asc') return <ChevronUp className={`${className} text-mynted-ink`} aria-hidden="true" />
  if (state === 'desc') return <ChevronDown className={`${className} text-mynted-ink`} aria-hidden="true" />
  return <ChevronsUpDown className={`${className} text-mynted-gray-light`} aria-hidden="true" />
}

/** Números visibles: 1 2 3 … N, centrados alrededor de la página actual. */
function getPageItems(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  if (page <= 3) [2, 3].forEach((n) => pages.add(n))
  if (page >= totalPages - 2) [totalPages - 1, totalPages - 2].forEach((n) => pages.add(n))
  const sorted = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  const items: (number | 'gap')[] = []
  sorted.forEach((n, index) => {
    if (index > 0 && n - sorted[index - 1] > 1) items.push('gap')
    items.push(n)
  })
  return items
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  const { t, language } = useLanguage()
  const buttonBase =
    'flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid'

  return (
    <nav aria-label={t('admin.table.paginationLabel')} className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('admin.table.previousPage')}
        className={`${buttonBase} cursor-pointer bg-mynted-bg text-mynted-ink hover:bg-mynted-border disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {getPageItems(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className={`${buttonBase} text-mynted-gray`} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={t('admin.table.pageN', { page: item })}
            aria-current={item === page ? 'page' : undefined}
            className={`${buttonBase} cursor-pointer ${
              item === page
                ? 'bg-mynted-blue-mid text-white'
                : 'border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg'
            }`}
          >
            {item.toLocaleString(language)}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={t('admin.table.nextPage')}
        className={`${buttonBase} cursor-pointer border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
