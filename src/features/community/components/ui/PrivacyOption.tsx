import type { PrivacyOptionProps } from "@/features/community/types/CommunityTypes";

export const PrivacyOption = ({ icon, title, description, selected, onSelect }: PrivacyOptionProps) => (
    <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={`flex flex-col gap-1.5 rounded-xl border px-4 py-4 text-left transition-colors hover:cursor-pointer ${
            selected
                ? 'border-mynted-orange bg-mynted-orange/5 ring-1 ring-mynted-orange'
                : 'border-mynted-border bg-white hover:border-mynted-orange/50'
        }`}
    >
        <span className={`flex items-center gap-2 font-heading text-[15px] font-semibold text-mynted-ink ${selected ? '[&_svg]:text-mynted-orange' : '[&_svg]:text-mynted-gray'}`}>
            {icon}
            {title}
        </span>
        <span className="max-w-xs text-xs text-mynted-gray">{description}</span>
    </button>
);