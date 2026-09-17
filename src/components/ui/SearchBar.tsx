"use client";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/cuicui/utils/cn";
import { useLanguage } from "@/i18n/LanguageContext";

export default function GrowingSearchVariant1() {
    const { t } = useLanguage()
    return (
        <div className="flex flex-col items-center">
            <p className="mb-8 text-neutral-500/70 tracking-tighter">
                {t('search.placeholder')}
            </p>
            <SearchBar />
        </div>
    );
}

export const SearchBar = () => {
    const { t } = useLanguage()
    const [searchSubmittedOutline, setSearchSubmittedOutline] = useState(false);
    const [searchSubmittedShadow, setSearchSubmittedShadow] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    function handleSearch() {
        setSearchSubmittedOutline(true);
        setSearchSubmittedShadow(true);
        toast(t('search.searchingToast', { query: searchValue }));
    }

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (searchSubmittedOutline) {
            timeoutId = setTimeout(() => {
                setSearchSubmittedOutline(false);
            }, 150);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [searchSubmittedOutline]);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (searchSubmittedShadow) {
            timeoutId = setTimeout(() => {
                setSearchSubmittedShadow(false);
            }, 1000);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [searchSubmittedShadow]);

    return (
        <label
            className={cn(
                "relative inline-flex origin-center rounded-full",
                "group transform-gpu transition-all ease-in-out",
                "before:absolute before:top-0 before:left-0 before:h-full before:w-full before:transform-gpu before:rounded-full before:transition-all before:duration-700 before:ease-in-out before:content-['']",
                searchSubmittedShadow
                    ? "before:shadow-[0px_0px_0px_5px_var(--color-mynted-blue-mid)] before:blur-2xl"
                    : "before:shadow-[0px_0px_1px_0px_#FFFFFF00] before:blur-0",
                searchSubmittedOutline
                    ? "scale-90 duration-75"
                    : "duration-300 hover:scale-105",
            )}
            htmlFor="search"
        >
            <input
                className={cn(
                    "peer max-w-10 transform-gpu rounded-full border border-mynted-border p-2 pl-10 text-mynted-white transition-all ease-in-out focus:max-w-40",
                    // BACKGROUND
                    "bg-mynted-yellow hover:opacity-90",
                    // OUTLINE
                    "-outline-offset-1 outline outline-1",
                    searchSubmittedOutline
                        ? "outline-mynted-white/70 duration-150"
                        : "outline-mynted-white/0 duration-300 hover:outline-mynted-white/30",
                    // PLACEHOLDER
                    "placeholder-black text-sm focus:placeholder-black",
                )}
                id="search"
                onBlur={() => {
                    setSearchSubmittedOutline(false);
                    setSearchSubmittedShadow(false);
                    setSearchValue("");
                }}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleSearch();
                    }
                }}
                onSubmit={handleSearch}
                placeholder={t('search.placeholder')}
                type="search"
                value={searchValue}
            />
            <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 size-5 text-black transition-colors" />
        </label>
    );
};
