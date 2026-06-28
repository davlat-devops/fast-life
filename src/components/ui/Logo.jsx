/**
 * Fast Education geometric double-F diamond mark.
 * Two mirrored F letterforms clipped inside a filled diamond.
 * Pass `color="white"` to invert (e.g. on dark backgrounds).
 */
export default function Logo({ size = 48, color = 'black', className = '' }) {
  const uid = `dc-${size}` // keep clipPath id unique per size on the page

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Fast Education"
      role="img"
    >
      <defs>
        <clipPath id={uid}>
          <polygon points="50,2 98,50 50,98 2,50" />
        </clipPath>
      </defs>

      {/* Diamond body */}
      <polygon points="50,2 98,50 50,98 2,50" fill={color} />

      {/* Double-F lettermark — clipped to stay within diamond silhouette */}
      <g clipPath={`url(#${uid})`} fill={color === 'black' ? 'white' : 'black'}>
        {/* Left F */}
        <rect x="19" y="22" width="7"  height="56" /> {/* stem  */}
        <rect x="19" y="22" width="24" height="7"  /> {/* top bar */}
        <rect x="19" y="44" width="17" height="6"  /> {/* mid bar */}

        {/* Right F — mirror of left around x = 50 */}
        <rect x="74" y="22" width="7"  height="56" /> {/* stem  */}
        <rect x="57" y="22" width="24" height="7"  /> {/* top bar */}
        <rect x="64" y="44" width="17" height="6"  /> {/* mid bar */}
      </g>
    </svg>
  )
}
