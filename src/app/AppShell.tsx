import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { label: 'Refund Explorer', to: '/explorer' },
  { label: 'Analytics', to: '/analytics' },
]

export function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

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
        </aside>

        <main className="app-main" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
