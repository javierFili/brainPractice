import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useServices } from '@/app/providers/servicesContext';
import { PreferencesProvider } from '@/app/providers/PreferencesProvider';
import { usePreferences } from '@/app/providers/preferencesContext';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Icon } from '@/components/ui/Icon';

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink
      to="/"
      className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-brand"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-cat-patterns text-brand-ink"
      >
        <Icon name="sparkle" className="h-5 w-5" />
      </span>
      <span className={compact ? 'sr-only' : ''}>
        Brain<span className="text-brand">Practice</span>
      </span>
    </NavLink>
  );
}

/** Mobile navigation drawer: a modal dialog with focus kept inside and Escape to close. */
function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    panel.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>('a, button')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-fade-in flex-col gap-4 overflow-y-auto border-r border-line bg-surface p-4"
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-muted hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name="close" label="Close navigation" />
          </button>
        </div>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}

function Shell() {
  const { persistence } = useServices();
  const { preferences, update } = usePreferences();
  const collapsed = preferences.sidebarCollapsed;
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  // A new screen starts at the top.
  useEffect(() => {
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }, [pathname]);

  const closeMobile = () => {
    setMobileOpen(false);
    menuButton.current?.focus();
  };

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-brand focus:px-3 focus:py-1 focus:text-brand-ink"
      >
        Skip to content
      </a>

      <aside
        aria-label="Sidebar"
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface/60 transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-[4.5rem]' : 'w-64'
        }`}
      >
        <div
          className={`flex items-center py-4 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}
        >
          <Brand compact={collapsed} />
        </div>
        <div className={`flex-1 overflow-y-auto pb-4 ${collapsed ? 'px-2' : 'px-3'}`}>
          <Sidebar collapsed={collapsed} />
        </div>
        <div className="border-t border-line p-2">
          <button
            type="button"
            aria-pressed={collapsed}
            onClick={() => {
              update({ sidebarCollapsed: !collapsed });
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-brand ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} />
            <span className={collapsed ? 'sr-only' : ''}>
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <button
            ref={menuButton}
            type="button"
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink-soft hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name="menu" />
            Menu
          </button>
        </header>
        <MobileNav open={mobileOpen} onClose={closeMobile} />

        {persistence === 'session-only' && (
          <p
            role="status"
            className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm text-warning"
          >
            This browser blocks local storage, so progress will be lost when you close the tab.
          </p>
        )}
        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-10"
        >
          <Suspense
            fallback={
              <p role="status" className="p-8 text-sm text-ink-muted">
                Loading…
              </p>
            }
          >
            <Outlet />
          </Suspense>
        </main>
        <footer className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-muted sm:px-6 lg:px-10">
            Recreational mental practice. Results describe performance on these activities only —
            this is not a medical, psychological or IQ assessment, and it does not diagnose, treat
            or prevent any condition.
          </p>
        </footer>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <PreferencesProvider>
      <Shell />
    </PreferencesProvider>
  );
}
