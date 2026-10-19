// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompaniesView } from './companies-view';

const companies = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  archive: vi.fn(),
  get: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  browserApiClient: {
    companies,
  },
}));

beforeEach(() => {
  companies.list.mockReset();
  companies.create.mockReset();
  companies.update.mockReset();
  companies.remove.mockReset();
  companies.archive.mockReset();
  companies.get.mockReset();
});

describe('CompaniesView', () => {
  it('renders companies from the API', async () => {
    companies.list.mockResolvedValue({
      data: [
        {
          id: 'company-1',
          name: 'Acme GmbH',
          website: 'https://acme.example',
          location: 'Berlin',
          description: null,
          createdAt: '2026-10-19T00:00:00.000Z',
          updatedAt: '2026-10-19T00:00:00.000Z',
          deletedAt: null,
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    render(<CompaniesView />);

    expect(await screen.findByText('Acme GmbH')).toBeInTheDocument();
    expect(screen.getByText('Berlin · https://acme.example')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new company/i })).toBeInTheDocument();
  });

  it('shows a useful empty state', async () => {
    companies.list.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    render(<CompaniesView />);

    expect(await screen.findByText('No companies')).toBeInTheDocument();
    expect(screen.getByText('Create a company to get started.')).toBeInTheDocument();
  });
});
