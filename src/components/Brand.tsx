/** Logo mark: a plectrum (guitar pick) in the site's colors. */
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="brand-g" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7be0a6" />
          <stop offset="0.5" stopColor="#ffb02e" />
          <stop offset="1" stopColor="#e5482e" />
        </linearGradient>
      </defs>
      <path d="M32 6c12 0 21 4.200 21 14.500 0 12.500-10 28-21 33.500C21 48.500 11 33 11 20.500 11 10.200 20 6 32 6Z" fill="url(#brand-g)" />
    </svg>
  );
}

/** Mark plus name. On narrow screens a long name scrolls round in a small window instead of overflowing (see .brand-* in globals.css). */
export default function Brand({ name }: { name: string }) {
  return (
    <span className="brand">
      <BrandMark />
      <span className="brand-name">
        <span className="brand-track">
          <span>{name}</span>
          <span className="brand-dup" aria-hidden="true">
            {name}
          </span>
        </span>
      </span>
    </span>
  );
}
