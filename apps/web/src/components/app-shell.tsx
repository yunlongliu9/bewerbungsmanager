'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth-provider';

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/applications', label: 'Applications' },
  { href: '/companies', label: 'Companies' },
  { href: '/interviews', label: 'Interviews' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/notes', label: 'Notes' },
];

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { owner, logout } = useAuth();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/dashboard" aria-label="Bewerbungsmanager home">
          Bewerbungsmanager
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="sr-only">{menuOpen ? 'Close navigation' : 'Open navigation'}</span>
          <span aria-hidden="true">{menuOpen ? 'Close' : 'Menu'}</span>
        </button>
        <div className="account">
          <span className="account-email">{owner?.email}</span>
          <button className="logout-button" type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside id="primary-navigation" className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
          <nav aria-label="Primary navigation">
            <ul>
              {navigation.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={active ? 'nav-link is-active' : 'nav-link'}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
