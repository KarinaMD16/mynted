import z from "zod";
import type { TranslateFn } from "@/i18n/LanguageContext";

/**
 * Igual que authSchemas.ts: se arma con makeCreateCommunitySchema(t) en vez
 * de ser un objeto estático, para que los mensajes de validación respeten
 * el idioma elegido (ver el useMemo en CreateCommunityForm).
 */
export function makeCreateCommunitySchema(t: TranslateFn) {
    return z.object({
        name: z.string().trim().min(1, { message: t('validation.community.nameRequired') }),

        description: z.string().trim().min(1, { message: t('validation.community.descriptionRequired') }),

        slug: z.string().min(1, { message: t('validation.community.slugRequired') })
        .refine((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), {
            message: t('validation.community.slugFormat'),
        }),

        isPrivate: z.boolean({ message: t('validation.community.isPrivateType') }),

        categoryId: z
            .number({ message: t('validation.community.categoryRequired') })
            .int({ message: t('validation.community.categoryRequired') })
            .positive({ message: t('validation.community.categoryRequired') }),

        tagIds: z.array(
            z
                .number({ message: t('validation.community.tagIdInvalid') })
                .int({ message: t('validation.community.tagIdInvalid') })
                .positive({ message: t('validation.community.tagIdInvalid') }),
        )
        .min(1, { message: t('validation.community.tagsMin') })
        .max(3, { message: t('validation.community.tagsMax') })
        .refine((tags) => new Set(tags).size === tags.length, {
            message: t('validation.community.tagsDuplicate'),
        }),

        rules: z.array(z.string().trim().min(1, { message: t('validation.community.ruleRequired') }))
        .min(1, { message: t('validation.community.rulesMin') })
        .refine((rules) => new Set(rules.map((rule) => rule.trim())).size === rules.length, {
            message: t('validation.community.rulesDuplicate'),
        }),
    });
}

export type CreateCommunityValues = z.infer<ReturnType<typeof makeCreateCommunitySchema>>;
