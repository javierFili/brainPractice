import { NavLink, Outlet } from 'react-router';
import { useServices } from '@/app/providers/servicesContext';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-2 py-1.5 text-sm transition-colors sm:px-3 ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`;

export function AppShell() {
  const { persistence } = useServices();
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-sky-400 focus:px-3 focus:py-1 focus:text-slate-950"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight whitespace-nowrap text-white"
          >
            <span aria-hidden="true" className="text-sky-400">
              {'{ }'}
            </span>{' '}
            brain<span className="text-sky-400">practice</span>
          </NavLink>
          <nav aria-label="Main">
            <ul className="flex items-center gap-0.5 sm:gap-1">
              <li>
                <NavLink to="/learn" className={navClass}>
                  Learn
                </NavLink>
              </li>
              <li>
                <NavLink to="/games" className={navClass}>
                  Train
                </NavLink>
              </li>
              <li>
                <NavLink to="/assessment" className={navClass}>
                  Assessment
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className={navClass}>
                  Progress
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      {persistence === 'session-only' && (
        <p
          role="status"
          className="border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center text-sm text-amber-100"
        >
          This browser blocks local storage, so progress will be lost when you close the tab.
        </p>
      )}
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800/80">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500 sm:px-6">
          Recreational cognitive training for programmers. Scores describe performance on these
          exercises only — this is not a psychometric or clinical assessment.
        </p>
      </footer>
    </div>
  );
}
