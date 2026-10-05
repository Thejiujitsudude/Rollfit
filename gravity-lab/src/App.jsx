import { useState } from 'react'
import OrbitsLab from './labs/OrbitsLab.jsx'
import SpacetimeLab from './labs/SpacetimeLab.jsx'
import LightLab from './labs/LightLab.jsx'
import TimeLab from './labs/TimeLab.jsx'
import { loadJSON, saveJSON } from './utils/storage.js'

const TABS = [
  { id: 'orbits', label: 'Orbits', Lab: OrbitsLab },
  { id: 'spacetime', label: 'Spacetime', Lab: SpacetimeLab },
  { id: 'light', label: 'Light', Lab: LightLab },
  { id: 'time', label: 'Time', Lab: TimeLab },
]
const TAB_KEY = 'gravitylab:tab'

export default function App() {
  const [tab, setTab] = useState(() => {
    const saved = loadJSON(TAB_KEY, 'orbits')
    return TABS.some((t) => t.id === saved) ? saved : 'orbits'
  })
  const { Lab } = TABS.find((t) => t.id === tab)

  const pick = (id) => {
    setTab(id)
    saveJSON(TAB_KEY, id)
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-25 12 12)" />
          </svg>
          Gravity Lab
        </span>
        <nav className="tabs" aria-label="Labs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tab ? 'on' : ''}
              aria-current={t.id === tab ? 'page' : undefined}
              onClick={() => pick(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="main">
        <Lab key={tab} />
      </main>
    </div>
  )
}
