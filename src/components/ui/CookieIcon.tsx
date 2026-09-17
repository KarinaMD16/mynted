export function CookieIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2a10 10 0 1 0 9.8 12.1c-.3.1-.6.1-.9.1a3.5 3.5 0 0 1-3.5-3.5c0-.3 0-.6.1-.9a3 3 0 0 1-3.4-3.4c.1-.3.1-.6.1-.9A3.5 3.5 0 0 1 12 2Z"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.3" cy="10.5" r="1" fill="currentColor" />
      <circle cx="12.5" cy="15.3" r="1" fill="currentColor" />
      <circle cx="15.8" cy="9.6" r="1" fill="currentColor" />
      <circle cx="9" cy="15.8" r="1" fill="currentColor" />
    </svg>
  )
}

export default CookieIcon
