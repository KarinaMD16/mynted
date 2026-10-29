import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'

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

/**
 * Anterior, números de página y siguiente. Lo usan la tabla del panel y los
 * listados de reportes, que paginan en el backend.
 */
export function AdminPagination({
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
    'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid'

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

/**
 * El pie de un listado que pagina el backend: "Mostrando X a Y de Z entradas"
 * y los botones de página, igual que en AdminDataTable.
 */
export function AdminPageFooter({
  page,
  limit,
  total,
  totalPages,
  onChange,
}: {
  page: number
  limit: number
  total: number
  totalPages: number
  onChange: (page: number) => void
}) {
  const { t, language } = useLanguage()
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-mynted-ink" aria-live="polite">
        {t('admin.table.showing', {
          from: from.toLocaleString(language),
          to: to.toLocaleString(language),
          total: total.toLocaleString(language),
        })}
      </p>
      <AdminPagination page={page} totalPages={Math.max(1, totalPages)} onChange={onChange} />
    </div>
  )
}
