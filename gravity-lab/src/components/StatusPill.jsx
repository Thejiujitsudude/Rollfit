/** Small live status badge. tone: idle | live | crash | orbit | escape */
export default function StatusPill({ tone = 'idle', children }) {
  return (
    <span className={`pill pill-${tone}`}>
      <i aria-hidden="true" />
      {children}
    </span>
  )
}
