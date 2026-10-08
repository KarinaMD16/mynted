import { SearchIcon } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { cn } from "@/cuicui/utils/cn";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Buscador del header: un campo siempre visible (antes era una píldora amarilla de
 * 40px que solo crecía al enfocarla, y la búsqueda es la acción principal de un
 * marketplace). Es un <form role="search">, así que Enter y el botón "Buscar" del
 * teclado móvil funcionan igual.
 *
 * OJO: todavía no busca de verdad. GET /products y GET /products/shop no aceptan un
 * filtro de texto, así que al enviar solo se muestra el aviso. Cuando el backend
 * agregue ese parámetro (p. ej. `q`), el cambio es en `handleSubmit`: navegar a
 * /explore con el texto en vez de mostrar el toast.
 */
export const SearchBar = ({ className }: { className?: string }) => {
    const { t } = useLanguage();
    const inputId = useId();
    const [value, setValue] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const query = value.trim();
        if (!query) return;
        toast(t('search.searchingToast', { query }));
    }

    return (
        <form role="search" onSubmit={handleSubmit} className={cn("relative w-full", className)}>
            <label htmlFor={inputId} className="sr-only">
                {t('search.placeholder')}
            </label>
            <SearchIcon
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mynted-gray"
                aria-hidden="true"
            />
            <input
                id={inputId}
                type="search"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={t('search.placeholderLong')}
                className="h-10 w-full rounded-full border border-mynted-border bg-white pr-4 pl-10 text-sm text-mynted-ink outline-none transition-colors placeholder:text-mynted-gray hover:border-mynted-gray-light focus:border-mynted-blue-mid focus:ring-2 focus:ring-mynted-blue-mid/20"
            />
        </form>
    );
};

export default SearchBar;
