/** Collapsible panel section. */
export default function ControlDrawer({ title, children, defaultOpen = true }) {
  return (
    <details className="drawer" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="drawer-body">{children}</div>
    </details>
  )
}
