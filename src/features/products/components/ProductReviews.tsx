import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { getInitials } from '@/features/profile/utils/profileFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatRelativeTime } from '@/utils/relativeTime'
import {
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
} from '../hooks/useProductMutations'
import { useProductReviews } from '../hooks/useProductQueries'
import { REVIEW_COMMENT_MAX_LENGTH, type ProductReview } from '../models/product'

const STARS = [1, 2, 3, 4, 5] as const

/** Selector de 1 a 5 estrellas (radiogroup: flechas del teclado y lectores de pantalla ya funcionan). */
function StarInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  const { t } = useLanguage()
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={t('product.ratingAriaLabel', { value: star, max: 5 })}
          onClick={() => onChange(star)}
          className="cursor-pointer rounded p-0.5 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
        >
          <Star
            className={cx('size-6 transition-colors', star <= value ? 'fill-amber-400 text-amber-400' : 'text-mynted-border')}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}

/** Alta de reseña o edición de la propia. Los errores del backend (403 propio producto, 409 ya reseñaste) se muestran tal cual. */
function ReviewForm({
  productId,
  existing,
  onDone,
}: {
  productId: number
  existing?: ProductReview
  onDone?: () => void
}) {
  const { t } = useLanguage()
  const create = useCreateReviewMutation(productId)
  const update = useUpdateReviewMutation(productId)
  const mutation = existing ? update : create

  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [showRatingError, setShowRatingError] = useState(false)

  function submit() {
    if (rating < 1) {
      setShowRatingError(true)
      return
    }
    const payload = { rating, comment: comment.trim() }
    const options = {
      onSuccess: () => {
        if (!existing) {
          setRating(0)
          setComment('')
        }
        setShowRatingError(false)
        onDone?.()
      },
    }
    if (existing) update.mutate(payload, options)
    else create.mutate(payload, options)
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <h3 className="font-heading text-base font-semibold text-mynted-ink">
        {existing ? t('reviews.editTitle') : t('reviews.writeTitle')}
      </h3>

      <div className="flex flex-col gap-1">
        <StarInput value={rating} onChange={setRating} label={t('reviews.yourRating')} />
        {showRatingError && rating < 1 && (
          <span className="text-xs text-red-500" role="alert">
            {t('reviews.ratingRequired')}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`review-comment-${productId}`} className="text-[13px] font-medium text-mynted-ink">
          {t('reviews.commentLabel')}
        </label>
        <textarea
          id={`review-comment-${productId}`}
          rows={3}
          maxLength={REVIEW_COMMENT_MAX_LENGTH}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t('reviews.commentPlaceholder')}
          className="w-full resize-y rounded-[10px] border border-mynted-border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none placeholder:text-mynted-gray-light focus:border-mynted-orange focus:ring-2 focus:ring-mynted-orange/20"
        />
        <span className="self-end text-xs text-mynted-gray">
          {comment.length}/{REVIEW_COMMENT_MAX_LENGTH}
        </span>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500" role="alert">
          {getApiErrorMessage(mutation.error)}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {existing && (
          <Button type="button" variant="secondary" size="md" onClick={onDone} disabled={mutation.isPending}>
            {t('profile.edit.cancel')}
          </Button>
        )}
        <Button type="submit" variant="primary" size="md" isLoading={mutation.isPending} disabled={mutation.isPending}>
          {mutation.isPending ? t('reviews.saving') : existing ? t('reviews.save') : t('reviews.submit')}
        </Button>
      </div>
    </form>
  )
}

function ReviewItem({ review, productId }: { review: ProductReview; productId: number }) {
  const { t, language } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const remove = useDeleteReviewMutation(productId)

  if (isEditing) {
    return (
      <li>
        <ReviewForm productId={productId} existing={review} onDone={() => setIsEditing(false)} />
      </li>
    )
  }

  const wasEdited = review.updatedAt !== review.createdAt

  return (
    <li className="flex gap-3 rounded-2xl border border-mynted-border bg-white p-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mynted-orange font-heading text-sm font-semibold text-white"
      >
        {review.author.photoUrl ? (
          <img src={review.author.photoUrl} alt="" className="size-full object-cover" />
        ) : (
          getInitials(review.author.username)
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to="/users/$userId"
            params={{ userId: review.author.id }}
            className="text-sm font-semibold text-mynted-ink hover:underline"
          >
            {review.author.username}
          </Link>
          {review.isMine && (
            <span className="rounded-full bg-mynted-orange/10 px-2 py-0.5 text-[10px] font-semibold text-mynted-orange">
              {t('reviews.you')}
            </span>
          )}
          <Rating value={review.rating} size={14} />
          <span className="text-xs text-mynted-gray">
            {formatRelativeTime(review.createdAt, language)}
            {wasEdited && ` · ${t('reviews.edited')}`}
          </span>
        </div>

        {review.comment?.trim() && (
          <p className="text-sm leading-[1.55] whitespace-pre-line text-[#1a1a1a]">{review.comment}</p>
        )}

        {review.isMine && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              {t('myProducts.action.edit')}
            </Button>
            {confirmDelete ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-red-600"
                  isLoading={remove.isPending}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate()}
                >
                  {t('reviews.deleteConfirm')}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={remove.isPending}>
                  {t('profile.edit.cancel')}
                </Button>
              </>
            ) : (
              <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => setConfirmDelete(true)}>
                {t('reviews.delete')}
              </Button>
            )}
            {remove.isError && (
              <span className="text-xs text-red-500" role="alert">
                {getApiErrorMessage(remove.error)}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

/**
 * Reseñas de un producto: promedio, lista paginada (GET /products/:id/reviews,
 * sin sesión) y, con sesión, formulario para reseñar o editar la propia (no se
 * muestra en un producto propio, `isOwnProduct`). El
 * backend no deja reseñar el producto propio (403) ni dos veces (409) y todavía
 * no exige haberlo comprado.
 */
export function ProductReviews({ productId, isOwnProduct = false }: { productId: number; isOwnProduct?: boolean }) {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const query = useProductReviews(productId)

  const first = query.data?.pages[0]
  const reviews = query.data?.pages.flatMap((page) => page.data) ?? []
  const hasMine = reviews.some((review) => review.isMine)

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="reviews-title" className="font-heading text-[22px] font-semibold text-mynted-ink">
          {t('reviews.title')}
        </h2>
        {first && first.reviewsCount > 0 && first.ratingAverage !== null && (
          <span className="flex items-center gap-2 text-sm text-mynted-gray">
            <Rating value={first.ratingAverage} size={16} />
            <span className="font-semibold text-mynted-ink">{first.ratingAverage.toFixed(1)}</span>
            <span>· {t('reviews.count', { count: first.reviewsCount })}</span>
          </span>
        )}
      </div>

      {isLoggedIn ? (
        // Nadie reseña su propio producto: ni formulario ni mensaje, solo las reseñas de los demás.
        !hasMine && !isOwnProduct && <ReviewForm productId={productId} />
      ) : (
        <p className="rounded-2xl border border-mynted-border bg-white px-5 py-4 text-sm text-mynted-gray">
          <Link to="/login" className="font-semibold text-mynted-orange hover:underline">
            {t('home.goToLogin')}
          </Link>{' '}
          {t('reviews.loginPrompt')}
        </p>
      )}

      {query.isPending ? (
        <div className="h-24 animate-pulse rounded-2xl bg-white" aria-busy="true" />
      ) : query.isError ? (
        <div className="flex flex-col items-start gap-2" role="alert">
          <p className="text-sm text-red-500">{t('reviews.loadError')}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void query.refetch()}>
            {t('communities.list.retry')}
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-mynted-gray">{t('reviews.empty')}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} productId={productId} />
            ))}
          </ul>
          {query.hasNextPage && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="mx-auto"
              isLoading={query.isFetchingNextPage}
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {t('products.list.loadMore')}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
