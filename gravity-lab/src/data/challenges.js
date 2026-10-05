// Each test gets a launch result: { outcome, planetId, e, angle, correct }
export const challenges = [
  { id: 'crash', title: 'Lawn dart', goal: 'Crash into the ground.', test: (r) => r.outcome === 'crash' },
  { id: 'orbit', title: 'Falling forever', goal: 'Get into orbit.', test: (r) => r.outcome === 'orbit' },
  {
    id: 'circle',
    title: 'Perfect circle',
    goal: 'Make an almost perfectly round orbit.',
    test: (r) => r.outcome === 'orbit' && r.e < 0.05,
  },
  { id: 'escape', title: 'Bye, gravity', goal: 'Escape for good.', test: (r) => r.outcome === 'escape' },
  {
    id: 'moon',
    title: 'Moonshot',
    goal: 'Get into orbit around the Moon.',
    test: (r) => r.outcome === 'orbit' && r.planetId === 'moon',
  },
  {
    id: 'jupiter',
    title: 'Giant leap',
    goal: 'Escape Jupiter.',
    test: (r) => r.outcome === 'escape' && r.planetId === 'jupiter',
  },
  {
    id: 'steep',
    title: 'Lob shot',
    goal: 'Reach orbit while launching 10 degrees or more upward.',
    test: (r) => r.outcome === 'orbit' && r.angle >= 10,
  },
  { id: 'oracle', title: 'Called it', goal: 'Predict the result correctly.', test: (r) => r.correct === true },
]
