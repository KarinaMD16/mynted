import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useForm } from '@tanstack/react-form';
import { Camera, Globe, ImagePlus, LoaderCircle, Lock, Plus, X } from 'lucide-react';
import { getApiErrorMessage } from '@/api/apiError';
import { getFieldErrorMessage } from '@/utils/form';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCreateCommunity } from '../hooks/useCommunitiesMutations';
import { useCategories } from '../hooks/useCommunitiesQueries';
import { makeCreateCommunitySchema } from '../schemas/createCommunitySchema';
import type { CreateCommunityValues } from '../schemas/createCommunitySchema';
import type { CreateCommunityFormProps, SelectedImage } from '../types/CommunityTypes';
import { DEFAULT_RULES, hintClasses, labelClasses, inputClasses, errorClasses } from '../types/DEFAULT_VALUES';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PrivacyOption } from './PrivacyOption';
import { TagPicker } from './TagPicker';

const slugify = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const CreateCommunityForm = ({ isOpen, onClose }: CreateCommunityFormProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-5xl">
                {isOpen && <CreateCommunityDialogBody onClose={onClose} />}
            </DialogContent>
        </Dialog>
    );
}

const CreateCommunityDialogBody = ({ onClose }: { onClose: () => void }) => {
    const { t } = useLanguage();
    const bannerInputId = useId();
    const imageInputId = useId();
    const privacyLabelId = useId();

    const [banner, setBanner] = useState<SelectedImage | null>(null);
    const [image, setImage] = useState<SelectedImage | null>(null);
    const slugEditedRef = useRef(false);

    const createCommunityMutation = useCreateCommunity();
    const categoriesQuery = useCategories();
    const createCommunitySchema = useMemo(() => makeCreateCommunitySchema(t), [t]);

    const defaultValues: CreateCommunityValues = {
        name: '',
        description: '',
        slug: '',
        isPrivate: false,
        categoryId: 0,
        tagIds: [],
        rules: DEFAULT_RULES,
    };

    const form = useForm({
        defaultValues,
        validators: { onChange: createCommunitySchema },
        onSubmit: async ({ value }) => {
            const formData = new FormData();
            formData.append('name', value.name.trim());
            formData.append('description', value.description.trim());
            formData.append('slug', value.slug);
            formData.append('isPrivate', String(value.isPrivate));
            formData.append('categoryId', String(value.categoryId));
            formData.append('tagIds', JSON.stringify(value.tagIds));
            formData.append('rules', JSON.stringify(value.rules.map((rule) => rule.trim())));
            if (image) formData.append('image', image.file);
            if (banner) formData.append('banner', banner.file);

            try {
                await createCommunityMutation.mutateAsync(formData);
                onClose();
            } catch {
                //el hook muestra el error
            }
        },
    });


    useEffect(() => () => { if (banner) URL.revokeObjectURL(banner.previewUrl); }, [banner]);
    useEffect(() => () => { if (image) URL.revokeObjectURL(image.previewUrl); }, [image]);

    const handleImageChange = (setter: (value: SelectedImage | null) => void) => (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setter({ file, previewUrl: URL.createObjectURL(file) });
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>{t('communities.create.title')}</DialogTitle>
                <DialogDescription>{t('communities.create.subtitle')}</DialogDescription>
            </DialogHeader>

                    <form
                        noValidate
                        onSubmit={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void form.handleSubmit();
                        }}
                    >
                        <div className="mt-6 flex flex-col gap-7 rounded-2xl border border-mynted-border p-4 sm:p-8">


                            <div className="relative mb-10">
                                <label
                                    htmlFor={bannerInputId}
                                    className="flex h-40 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed border-mynted-border bg-mynted-bg px-4 text-center transition-colors hover:border-mynted-orange/60 sm:h-50"
                                >
                                    {banner ? (
                                        <img src={banner.previewUrl} alt={t('communities.create.bannerPreviewAlt')} className="h-full w-full object-cover" />
                                    ) : (
                                        <>
                                            <ImagePlus className="size-7 text-mynted-orange" aria-hidden="true" />
                                            <span className="text-sm font-medium text-mynted-ink">{t('communities.create.uploadBanner')}</span>
                                            <span className={hintClasses}>{t('communities.create.bannerHint')}</span>
                                        </>
                                    )}
                                </label>
                                <input id={bannerInputId} type="file" accept="image/png,image/jpeg" className="sr-only" onChange={handleImageChange(setBanner)} />

                                {banner && (
                                    <button
                                        type="button"
                                        onClick={() => setBanner(null)}
                                        aria-label={t('communities.create.removeBanner')}
                                        className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 text-mynted-ink shadow hover:cursor-pointer hover:bg-white"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}

                                <label
                                    htmlFor={imageInputId}
                                    aria-label={t('communities.create.uploadImage')}
                                    className="absolute -bottom-11 left-5 flex size-22 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-mynted-yellow shadow-sm transition-transform hover:scale-105 sm:left-10"
                                >
                                    {image ? (
                                        <img src={image.previewUrl} alt={t('communities.create.imagePreviewAlt')} className="h-full w-full object-cover" />
                                    ) : (
                                        <Camera className="size-6 text-mynted-ink" aria-hidden="true" />
                                    )}
                                </label>
                                <input id={imageInputId} type="file" accept="image/png,image/jpeg" className="sr-only" onChange={handleImageChange(setImage)} />
                            </div>


                            <div className="grid gap-5 sm:grid-cols-2">
                                <form.Field name="name">
                                    {(field) => {
                                        const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined;
                                        return (
                                            <div className="flex flex-col gap-1.5">
                                                <label htmlFor={field.name} className={labelClasses}>{t('communities.create.nameLabel')}</label>
                                                <input
                                                    id={field.name}
                                                    type="text"
                                                    placeholder={t('communities.create.namePlaceholder')}
                                                    className={inputClasses(Boolean(error))}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(event) => {
                                                        field.handleChange(event.target.value);
                                                        if (!slugEditedRef.current) {
                                                            form.setFieldValue('slug', slugify(event.target.value));
                                                        }
                                                    }}
                                                    aria-invalid={Boolean(error)}
                                                />
                                                {error && <span className={errorClasses}>{error}</span>}
                                            </div>
                                        );
                                    }}
                                </form.Field>

                                <form.Field name="slug">
                                    {(field) => {
                                        const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined;
                                        return (
                                            <div className="flex flex-col gap-1.5">
                                                <label htmlFor={field.name} className={labelClasses}>{t('communities.create.slugLabel')}</label>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-mynted-gray">@</span>
                                                    <input
                                                        id={field.name}
                                                        type="text"
                                                        placeholder="mylittlepony"
                                                        autoCapitalize="none"
                                                        spellCheck={false}
                                                        className={`${inputClasses(Boolean(error))} pl-7`}
                                                        value={field.state.value}
                                                        onBlur={field.handleBlur}
                                                        onChange={(event) => {
                                                            slugEditedRef.current = true;
                                                            field.handleChange(event.target.value.toLowerCase().replace(/\s+/g, '-'));
                                                        }}
                                                        aria-invalid={Boolean(error)}
                                                    />
                                                </div>
                                                {error
                                                    ? <span className={errorClasses}>{error}</span>
                                                    : <span className={hintClasses}>{t('communities.create.slugHint')}</span>}
                                            </div>
                                        );
                                    }}
                                </form.Field>
                            </div>


                            <form.Field name="description">
                                {(field) => {
                                    const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined;
                                    return (
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor={field.name} className={labelClasses}>{t('communities.create.descriptionLabel')}</label>
                                            <textarea
                                                id={field.name}
                                                rows={3}
                                                placeholder={t('communities.create.descriptionPlaceholder')}
                                                className={`${inputClasses(Boolean(error))} resize-y`}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(event) => field.handleChange(event.target.value)}
                                                aria-invalid={Boolean(error)}
                                            />
                                            {error && <span className={errorClasses}>{error}</span>}
                                        </div>
                                    );
                                }}
                            </form.Field>


                            <form.Field name="categoryId">
                                {(field) => {
                                    const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined;
                                    return (
                                        <fieldset className="flex flex-col gap-1.5">
                                            <legend className={labelClasses}>{t('communities.create.categoryLabel')}</legend>
                                            <p className={`${hintClasses} mt-1.5`}>{t('communities.create.categoryHint')}</p>

                                            <div className="mt-1.5 flex flex-wrap gap-2">
                                                {categoriesQuery.isPending && Array.from({ length: 6 }, (_, index) => (
                                                    <span key={index} className="h-8 w-24 animate-pulse rounded-full bg-mynted-bg" />
                                                ))}

                                                {categoriesQuery.data?.map((category) => {
                                                    const isSelected = field.state.value === category.categoryId;
                                                    return (
                                                        <button
                                                            key={category.categoryId}
                                                            type="button"
                                                            aria-pressed={isSelected}
                                                            onClick={() => {
                                                                if (isSelected) return;
                                                                field.handleChange(category.categoryId);
                                                                form.setFieldValue('tagIds', []);
                                                            }}
                                                            className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors hover:cursor-pointer ${
                                                                isSelected
                                                                    ? 'border-mynted-orange bg-mynted-orange text-white'
                                                                    : 'border-mynted-border bg-white text-mynted-ink hover:border-mynted-orange'
                                                            }`}
                                                        >
                                                            {category.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {categoriesQuery.isError && (
                                                <span className={errorClasses}>
                                                    {t('communities.create.categoriesLoadError')} {getApiErrorMessage(categoriesQuery.error)}
                                                </span>
                                            )}
                                            {error && <span className={errorClasses}>{error}</span>}
                                        </fieldset>
                                    );
                                }}
                            </form.Field>

                            <form.Subscribe selector={(state) => state.values.categoryId}>
                                {(categoryId) => categoryId > 0 && (
                                    <form.Field name="tagIds">
                                        {(field) => (
                                            <TagPicker
                                                categoryId={categoryId}
                                                selected={field.state.value}
                                                onChange={field.handleChange}
                                                error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
                                            />
                                        )}
                                    </form.Field>
                                )}
                            </form.Subscribe>

                            <form.Field name="isPrivate">
                                {(field) => (
                                    <div className="flex flex-col gap-1.5">
                                        <span id={privacyLabelId} className={labelClasses}>{t('communities.create.privacyLabel')}</span>
                                        <div role="radiogroup" aria-labelledby={privacyLabelId} className="mt-1 grid gap-4 sm:grid-cols-2">
                                            <PrivacyOption
                                                icon={<Globe className="size-4.5" aria-hidden="true" />}
                                                title={t('communities.create.publicTitle')}
                                                description={t('communities.create.publicDescription')}
                                                selected={!field.state.value}
                                                onSelect={() => field.handleChange(false)}
                                            />
                                            <PrivacyOption
                                                icon={<Lock className="size-4.5" aria-hidden="true" />}
                                                title={t('communities.create.privateTitle')}
                                                description={t('communities.create.privateDescription')}
                                                selected={field.state.value}
                                                onSelect={() => field.handleChange(true)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </form.Field>


                            <form.Field name="rules" mode="array">
                                {(rulesField) => {
                                    const listError = rulesField.state.meta.isTouched ? getFieldErrorMessage(rulesField.state.meta.errors) : undefined;
                                    return (
                                        <div className="flex flex-col gap-1.5">
                                            <span className={labelClasses}>{t('communities.create.rulesLabel')}</span>
                                            <p className={hintClasses}>{t('communities.create.rulesHint')}</p>

                                            <ol className="mt-1.5 flex flex-col gap-2.5">
                                                {rulesField.state.value.map((_, index) => (
                                                    <form.Field key={index} name={`rules[${index}]`}>
                                                        {(ruleField) => {
                                                            const error = ruleField.state.meta.isTouched ? getFieldErrorMessage(ruleField.state.meta.errors) : undefined;
                                                            return (
                                                                <li className="flex flex-col gap-1">
                                                                    <div className={`group flex items-center gap-3 rounded-xl bg-mynted-bg px-3.5 py-2.5 focus-within:ring-2 ${error ? 'ring-2 ring-red-300' : 'focus-within:ring-mynted-orange/20'}`}>
                                                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-mynted-border bg-white text-xs text-mynted-ink">
                                                                            {index + 1}
                                                                        </span>
                                                                        <input
                                                                            type="text"
                                                                            aria-label={t('communities.create.ruleAriaLabel', { number: index + 1 })}
                                                                            placeholder={t('communities.create.rulePlaceholder')}
                                                                            className="min-w-0 flex-1 bg-transparent text-[13px] text-mynted-ink outline-none placeholder:text-mynted-gray-light"
                                                                            value={ruleField.state.value}
                                                                            onBlur={ruleField.handleBlur}
                                                                            onChange={(event) => ruleField.handleChange(event.target.value)}
                                                                        />
                                                                        {rulesField.state.value.length > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => rulesField.removeValue(index)}
                                                                                aria-label={t('communities.create.removeRuleAriaLabel', { number: index + 1 })}
                                                                                className="rounded-full p-1 text-mynted-gray-light transition-colors hover:cursor-pointer hover:bg-white hover:text-red-500"
                                                                            >
                                                                                <X className="size-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {error && <span className={`${errorClasses} pl-1`}>{error}</span>}
                                                                </li>
                                                            );
                                                        }}
                                                    </form.Field>
                                                ))}
                                            </ol>

                                            {listError && <span className={errorClasses}>{listError}</span>}

                                            <button
                                                type="button"
                                                onClick={() => rulesField.pushValue('')}
                                                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-mynted-border px-3 py-1.5 text-[13px] text-mynted-gray transition-colors hover:cursor-pointer hover:border-mynted-orange hover:text-mynted-orange"
                                            >
                                                <Plus className="size-4" aria-hidden="true" />
                                                {t('communities.create.addRule')}
                                            </button>
                                        </div>
                                    );
                                }}
                            </form.Field>
                        </div>

                        {createCommunityMutation.isError && (
                            <p className="mt-4 text-right text-sm text-red-500" role="alert">
                                {getApiErrorMessage(createCommunityMutation.error)}
                            </p>
                        )}

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-mynted-border bg-white px-7 py-3 font-heading text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg"
                            >
                                {t('communities.create.cancel')}
                            </button>

                            <form.Subscribe selector={(state) => state.isSubmitting}>
                                {(isSubmitting) => (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-mynted-orange px-7 py-3 font-heading text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                                                {t('communities.create.creating')}
                                            </>
                                        ) : (
                                            <>
                                                {t('communities.create.submit')}
                                            </>
                                        )}
                                    </button>
                                )}
                            </form.Subscribe>
                        </DialogFooter>
                    </form>
        </>
    );
}
