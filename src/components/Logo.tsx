export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow effect using Primary Blue #0033A0 */}
        <filter id="blueGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feFlood floodColor="#0033A0" floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>

        {/* Gradient using Primary Red #CB102E */}
        <linearGradient id="primaryRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E63946" /> {/* Slightly lighter for depth */}
          <stop offset="100%" stopColor="#CB102E" />
        </linearGradient>
      </defs>
      
      {/* Outer White Square with Primary Blue Glow */}
      <rect
        x="12"
        y="12"
        width="76"
        height="76"
        rx="14"
        fill="#ffffff"
        stroke="#0033A0"
        strokeWidth="1.5"
        filter="url(#blueGlow)"
      />
      
      {/* Calendar Top Header (Red) */}
      <path
        d="M28 30 h44 v12 h-44 z"
        fill="url(#primaryRedGrad)"
      />
      <circle cx="28" cy="30" r="3" fill="url(#primaryRedGrad)" />
      <circle cx="72" cy="30" r="3" fill="url(#primaryRedGrad)" />
      
      {/* Calendar Rings (Primary Blue) */}
      <rect x="36" y="22" width="5" height="12" rx="2.5" fill="#0033A0" />
      <rect x="59" y="22" width="5" height="12" rx="2.5" fill="#0033A0" />
      
      {/* Calendar Body Border (Red) */}
      <path
        d="M28 42 h44 v30 a6 6 0 0 1 -6 6 h-32 a6 6 0 0 1 -6 -6 z"
        fill="none"
        stroke="#CB102E"
        strokeWidth="4.5"
      />
      
      {/* Grid Lines (Primary Blue) */}
      <line x1="28" y1="52" x2="72" y2="52" stroke="#0033A0" strokeWidth="1.5" opacity="0.6" />
      <line x1="28" y1="62" x2="72" y2="62" stroke="#0033A0" strokeWidth="1.5" opacity="0.6" />
      <line x1="42.5" y1="42" x2="42.5" y2="78" stroke="#0033A0" strokeWidth="1.5" opacity="0.6" />
      <line x1="57.5" y1="42" x2="57.5" y2="78" stroke="#0033A0" strokeWidth="1.5" opacity="0.6" />
      
      {/* Bold Red Checkmark with white knockout border */}
      <path
        d="M36 58 L48 70 L82 25 L74 18 L47 50 L42 45 Z"
        fill="#CB102E"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}