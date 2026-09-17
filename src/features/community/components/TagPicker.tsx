import { getApiErrorMessage } from "@/api/apiError";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTags } from "../hooks/useCommunitiesQueries";
import type { TagPickerProps } from "../types/CommunityTypes";
import { labelClasses, hintClasses, MAX_TAGS, errorClasses } from "../types/DEFAULT_VALUES";

export const TagPicker = ({ categoryId, selected, onChange, error }: TagPickerProps) => {
    const { t } = useLanguage()
    const tagsQuery = useTags();

    const availableTags = tagsQuery.data?.filter((tag) => tag.categoryId === null || tag.categoryId === categoryId);

    const toggleTag = (tagId: number) => {
        onChange(selected.includes(tagId) ? selected.filter((id) => id !== tagId) : [...selected, tagId]);
    };

    return (
        <fieldset className="flex flex-col gap-1.5">
            <legend className={labelClasses}>{t('communities.tags.legend')}</legend>
            <p className={`${hintClasses} mt-1.5`}>
                {t('communities.tags.hint', { max: MAX_TAGS, count: selected.length })}
            </p>

            <div className="mt-1.5 flex flex-wrap gap-2">
                {tagsQuery.isPending && Array.from({ length: 4 }, (_, index) => (
                    <span key={index} className="h-7 w-20 animate-pulse rounded-full bg-mynted-bg" />
                ))}

                {availableTags?.map((tag) => {
                    const isSelected = selected.includes(tag.tagId);
                    const isDisabled = !isSelected && selected.length >= MAX_TAGS;
                    return (
                        <button
                            key={tag.tagId}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isDisabled}
                            onClick={() => toggleTag(tag.tagId)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                                isSelected
                                    ? 'border-mynted-yellow bg-mynted-yellow text-mynted-ink'
                                    : 'border-mynted-border bg-white text-mynted-ink enabled:hover:border-mynted-orange'
                            }`}
                        >
                            {tag.name}
                        </button>
                    );
                })}
            </div>

            {availableTags?.length === 0 && <span className={hintClasses}>{t('communities.tags.empty')}</span>}
            {tagsQuery.isError && (
                <span className={errorClasses}>
                    {t('communities.tags.loadError')} {getApiErrorMessage(tagsQuery.error)}
                </span>
            )}
            {error && <span className={errorClasses}>{error}</span>}
        </fieldset>
    );
}
