// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationsView } from './applications-view';

const { applications, companies } = vi.hoisted(() => ({
  applications: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  },
  companies: {
    list: vi.fn(),
  },
}));

vi.mock('../lib/api', () => ({
  browserApiClient: {
    applications,
    companies,
  },
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  applications.list.mockReset();
  companies.list.mockReset();

  applications.list.mockResolvedValue({
    data: [
      {
        id: 'application-1',
        companyId: 'company-1',
        jobTitle: 'Backend Engineer',
        status: 'APPLIED',
        appliedAt: '2026-10-18T00:00:00.000Z',
        employmentType: 'FULL_TIME',
        workMode: 'REMOTE',
        priority: 'HIGH',
        createdAt: '2026-10-18T00:00:00.000Z',
        updatedAt: '2026-10-18T00:00:00.000Z',
        company: {
          id: 'company-1',
          name: 'Acme GmbH',
          createdAt: '2026-10-18T00:00:00.000Z',
          updatedAt: '2026-10-18T00:00:00.000Z',
        },
      },
    ],
    meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
  });

  companies.list.mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
  });
});

describe('ApplicationsView', () => {
  it('loads and renders applications from the API', async () => {
    render(<ApplicationsView />);

    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Acme GmbH · APPLIED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new application/i })).toBeInTheDocument();
  });
});
