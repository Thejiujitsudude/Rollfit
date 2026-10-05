/** Checklist of goals. done = Set of challenge ids. */
export default function ChallengeList({ items, done, onReset }) {
  return (
    <section className="card">
      <div className="card-head">
        <h3>Challenges</h3>
        <span className="muted small">
          {items.filter((c) => done.has(c.id)).length} / {items.length}
        </span>
      </div>
      <ul className="challenges">
        {items.map((c) => (
          <li key={c.id} className={done.has(c.id) ? 'done' : ''}>
            <span className="check" aria-hidden="true" />
            <span>
              <b>{c.title}</b>
              <span className="muted small"> {c.goal}</span>
            </span>
          </li>
        ))}
      </ul>
      {done.size > 0 && (
        <button type="button" className="linkbtn" onClick={onReset}>
          Reset challenges
        </button>
      )}
    </section>
  )
}
