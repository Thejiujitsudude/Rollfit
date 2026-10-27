import { useEffect, useState } from 'react'
import { SECTIONS, ALL_LABS } from './catalog.js'

const readHash = () => window.location.hash.replace(/^#/, '')

export default function App() {
  const [route, setRoute] = useState(readHash)
  useEffect(() => {
    const onHash = () => setRoute(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (id) => {
    window.location.hash = id
    setRoute(id)
  }
  const lab = ALL_LABS.find((l) => l.id === route)

  return (
    <div className="app">
      <header className="topbar">
        {lab ? (
          <>
            <button type="button" className="back" onClick={() => go('')}>
              ‹ All labs
            </button>
            <span className="crumb">
              {lab.section.title} · <b>{lab.title}</b>
            </span>
          </>
        ) : (
          <span className="logo">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-25 12 12)" />
            </svg>
            Gravity Lab
          </span>
        )}
      </header>
      <main className="main">{lab ? <lab.Lab key={lab.id} /> : <Home go={go} />}</main>
    </div>
  )
}

function Home({ go }) {
  return (
    <div className="home">
      <section className="hero">
        <h1>Play with the laws of the universe.</h1>
        <p>Newton's motion, Einstein's spacetime, and the stars and planets they explain. Every idea is a toy you can poke.</p>
      </section>
      {SECTIONS.map((s) => (
        <section key={s.id} className={`shelf shelf-${s.id}`}>
          <div className="shelf-head">
            <h2>{s.title}</h2>
            <span className="era">{s.era}</span>
          </div>
          <p className="muted">{s.blurb}</p>
          <div className="cards">
            {s.labs.map((l) =>
              l.Lab ? (
                <button key={l.id} type="button" className="labcard" onClick={() => go(l.id)}>
                  <b>{l.title}</b>
                  <span>{l.blurb}</span>
                </button>
              ) : (
                <div key={l.id} className="labcard soon" aria-disabled="true">
                  <b>{l.title}</b>
                  <span>{l.blurb}</span>
                  <em>Coming soon</em>
                </div>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
