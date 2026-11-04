import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { useText } from '@/i18n';
import { NAV_SECTIONS } from './navigation';

const linkClass =
  (collapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 rounded-lg py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${
      collapsed ? 'justify-center px-2' : 'px-3'
    } ${
      isActive
        ? 'bg-brand/15 font-semibold text-ink before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-1 before:rounded-full before:bg-brand'
        : 'text-ink-muted hover:bg-raised hover:text-ink'
    }`;

/**
 * Section navigation. The active entry is marked by weight, a bar and `aria-current`, not only by
 * colour. Collapsed, labels become tooltips (shown on hover and keyboard focus) and stay readable
 * by screen readers.
 */
export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  readonly collapsed?: boolean;
  readonly onNavigate?: () => void;
}) {
  const { t } = useTranslation('nav');
  const tx = useText();
  return (
    <nav aria-label={t('landmarks.main')} className="flex flex-col gap-5">
      {NAV_SECTIONS.map((section) => (
        <div key={section.id}>
          <h2
            className={
              collapsed
                ? 'sr-only'
                : 'mb-1.5 px-3 text-[11px] font-semibold tracking-widest text-ink-muted uppercase'
            }
          >
            {tx(section.title)}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end ?? false}
                  className={linkClass(collapsed)}
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                >
                  <Icon name={item.icon} />
                  <span className={collapsed ? 'sr-only' : 'truncate'}>{tx(item.label)}</span>
                  {collapsed && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-full z-30 ml-3 rounded-md border border-line bg-raised px-2 py-1 text-xs whitespace-nowrap text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      {tx(item.label)}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
