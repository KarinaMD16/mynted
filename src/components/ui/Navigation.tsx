"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useLanguage } from "@/i18n/LanguageContext";
import { NAV_ITEMS } from "./navItems";

interface NavigationProps {
  className?: string
}

export function Navigation({ className = 'flex flex-col items-center gap-1.5 sm:flex-row' }: NavigationProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { t } = useLanguage();
  const activeIndex = NAV_ITEMS.findIndex((item) => item.href === pathname);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const highlightedIndex = hoveredIndex ?? (activeIndex === -1 ? null : activeIndex);

  return (
    <nav className={className} onMouseLeave={() => setHoveredIndex(null)}>
      {NAV_ITEMS.map((item, index) => (
        <Link
          key={item.href}
          to={item.href}
          aria-current={item.href === pathname ? 'page' : undefined}
          onMouseEnter={() => setHoveredIndex(index)}
          className={`relative isolate inline-flex w-fit items-center whitespace-nowrap rounded-[10px] px-4 py-[9px] text-[15px] transition-colors ${
            highlightedIndex === index ? 'font-semibold text-mynted-white' : 'font-medium text-mynted-gray'
          }`}
        >
          {t(item.labelKey)}
          <AnimatePresence>
            {highlightedIndex === index && (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="-z-10 absolute inset-0 rounded-[10px] bg-mynted-orange"
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.95 }}
                layout={true}
                layoutId="nav-highlight"
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>
        </Link>
      ))}
    </nav>
  );
}

export default Navigation;
