import z from "zod";

export const createCommunitySchema = z.object({
    name: z.string().trim().min(1, { message: "El nombre no puede ir vacío" }),

    description: z.string().trim().min(1, { message: "La descripción no puede ir vacía" }),

    slug: z.string().min(1, { message: "El identificador no puede ir vacío" })
    .refine((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), {
        message: "Solo puede contener letras minúsculas, números y guiones",
    }),

    isPrivate: z.boolean({ message: "El estado de privacidad de la comunidad debe ser un valor booleano" }),

    categoryId: z.number({ message: "Selecciona una categoría" }).int().positive({ message: "Selecciona una categoría" }),

    tagIds: z.array(z.number().int({ message: "El ID del tag debe ser un número entero positivo" }).positive())
    .min(1, { message: "Selecciona al menos un tag" })
    .max(3, { message: "No puedes seleccionar más de 3 tags" })
    .refine((tags) => new Set(tags).size === tags.length, {
        message: "Los tags no pueden repetirse",
    }),

    rules: z.array(z.string().trim().min(1, { message: "La regla no puede ir vacía" }))
    .min(1, { message: "Debe proporcionar al menos una regla" })
    .refine((rules) => new Set(rules.map((rule) => rule.trim())).size === rules.length, {
        message: "Las reglas no pueden repetirse",
    }),
});

export type CreateCommunityValues = z.infer<typeof createCommunitySchema>;
