import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { label: 'Refund Explorer', to: '/explorer' },
  { label: 'Analytics', to: '/analytics' },
]

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__content">
          <div className="app-header__identity">
            <p className="app-header__eyebrow">LuzonMart Ops Workbench</p>
            <div>
              <h1>Manila Refund Resolution</h1>
              <p className="app-header__summary">
                Investigate refund disputes, understand operational risk, and
                keep batch decisions safe.
              </p>
            </div>
          </div>

          <div className="app-header__status" aria-label="Environment summary">
            <span className="status-pill status-pill--live">Local Demo</span>
            <span className="status-pill">Vite + React + TypeScript</span>
            <span className="status-pill">Mobile & A11y Baseline</span>
          </div>
        </div>
      </header>

      <div className="app-layout">
        <aside className="app-sidebar" aria-label="Primary navigation">
          <nav className="app-nav">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  isActive
                    ? 'app-nav__link app-nav__link--active'
                    : 'app-nav__link'
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <section
            className="app-sidebar__panel"
            aria-labelledby="milestone-heading"
          >
            <p className="app-sidebar__label">Current Milestone</p>
            <h2 id="milestone-heading">Project Foundation</h2>
            <p>
              Shared layout, routing, design tokens, and testing scaffolding are
              now wired so feature work can land on a stable base.
            </p>
          </section>
        </aside>

        <main className="app-main" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
