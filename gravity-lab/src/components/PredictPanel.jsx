import { zones, zoneById } from '../data/zones.js'

/** Guess before you launch. Shows the verdict after. */
export default function PredictPanel({ predicted, onPredict, result, locked }) {
  return (
    <section className="card">
      <h3>Predict first</h3>
      <p className="muted small">What will happen when you launch? Pick before you hit Launch.</p>
      <div className="chips">
        {zones.map((z) => (
          <button
            key={z.id}
            type="button"
            className={`chip ${predicted === z.id ? 'on' : ''}`}
            style={{ '--chip': z.color }}
            disabled={locked}
            onClick={() => onPredict(predicted === z.id ? null : z.id)}
          >
            {z.label}
          </button>
        ))}
      </div>
      {result && (
        <p className={`verdict ${result.correct === true ? 'good' : result.correct === false ? 'bad' : ''}`}>
          Result: <strong>{zoneById[result.outcome].label}</strong>.{' '}
          {result.correct === true && 'You called it.'}
          {result.correct === false && `You guessed ${zoneById[result.predicted].label}.`}
          {result.correct === null && 'Make a guess next time.'}
        </p>
      )}
    </section>
  )
}
