import { useState } from 'react'
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCommunityModeration } from '@/features/community/hooks/useCommunitiesMutations'
import type { CommunityDetail } from '@/features/community/models/communityDTOs'
import { errorClasses, hintClasses, inputClasses, labelClasses } from '@/features/community/types/DEFAULT_VALUES'


export function ModerationRulesSection({ community }: { community: CommunityDetail }) {
  const { t } = useLanguage()
  const { addRules, editRule, removeRule } = useCommunityModeration(community.id)

  const [newRule, setNewRule] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

  const handleAdd = () => {
    const description = newRule.trim()
    if (!description) return
    addRules.mutate([description], { onSuccess: () => setNewRule('') })
  }

  const handleSaveEdit = () => {
    const description = editingText.trim()
    if (editingId === null || !description) return
    editRule.mutate({ ruleId: editingId, description }, { onSuccess: () => setEditingId(null) })
  }

  const error = addRules.error ?? editRule.error ?? removeRule.error

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('moderation.rules.title')}</h2>
        <p className={hintClasses}>{t('moderation.rules.hint')}</p>
      </div>

      <ol className="flex flex-col gap-2.5">
        {community.rules.map((rule, index) => {
          const isEditing = editingId === rule.communityRuleId

          return (
            <li
              key={rule.communityRuleId}
              className="flex items-center gap-3 rounded-xl border border-mynted-border bg-white px-3.5 py-2.5"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mynted-bg text-xs text-mynted-ink">
                {index + 1}
              </span>

              {isEditing ? (
                <>
                  <input
                    type="text"
                    aria-label={t('moderation.rules.editAriaLabel', { number: index + 1 })}
                    className={`${inputClasses(false)} flex-1 py-1.5`}
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={editRule.isPending || editingText.trim().length === 0}
                    aria-label={t('moderation.rules.save')}
                    className="rounded-full p-1.5 text-emerald-600 transition-colors hover:cursor-pointer hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {editRule.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    aria-label={t('moderation.rules.cancel')}
                    className="rounded-full p-1.5 text-mynted-gray transition-colors hover:cursor-pointer hover:bg-mynted-bg"
                  >
                    <X className="size-4" />
                  </button>
                </>
              ) : (
                <>
                  <p className="min-w-0 flex-1 text-sm text-mynted-ink">{rule.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(rule.communityRuleId)
                      setEditingText(rule.description)
                    }}
                    aria-label={t('moderation.rules.editAriaLabel', { number: index + 1 })}
                    className="rounded-full p-1.5 text-mynted-gray transition-colors hover:cursor-pointer hover:bg-mynted-bg hover:text-mynted-ink"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRule.mutate(rule.communityRuleId)}
                    disabled={removeRule.isPending}
                    aria-label={t('moderation.rules.deleteAriaLabel', { number: index + 1 })}
                    className="rounded-full p-1.5 text-mynted-gray transition-colors hover:cursor-pointer hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ol>

      {community.rules.length === 0 && <p className="text-sm text-mynted-gray">{t('community.detail.noRules')}</p>}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-rule" className={labelClasses}>
          {t('moderation.rules.addLabel')}
        </label>
        <div className="flex gap-2">
          <input
            id="new-rule"
            type="text"
            placeholder={t('communities.create.rulePlaceholder')}
            className={inputClasses(false)}
            value={newRule}
            onChange={(event) => setNewRule(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={addRules.isPending || newRule.trim().length === 0}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-mynted-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addRules.isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {t('moderation.rules.add')}
          </button>
        </div>
      </div>

      {error && (
        <p className={errorClasses} role="alert">
          {getApiErrorMessage(error)}
        </p>
      )}
    </section>
  )
}
