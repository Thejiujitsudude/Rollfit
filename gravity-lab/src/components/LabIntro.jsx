import { intros } from '../data/intros.js'

/** "Big idea / You've seen it / Try this first" card at the top of every lab. */
export default function LabIntro({ id }) {
  const it = intros[id]
  if (!it) return null
  return (
    <section className="card intro">
      <div className="intro-row intro-idea">
        <span>Big idea</span>
        <p>{it.idea}</p>
      </div>
      <div className="intro-row">
        <span>You've seen it when</span>
        <p>{it.example}</p>
      </div>
      <div className="intro-row">
        <span>Try this first</span>
        <p>{it.first}</p>
      </div>
    </section>
  )
}
