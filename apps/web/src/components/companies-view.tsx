'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { browserApiClient, type Company, type PaginatedResponse } from '../lib/api';
import { EmptyState, ErrorState, LoadingState, PageHeader } from './page-state';

type FormState = {
  name: string;
  website: string;
  location: string;
  description: string;
};

const emptyForm: FormState = {
  name: '',
  website: '',
  location: '',
  description: '',
};

export function CompaniesView() {
  const [result, setResult] = useState<PaginatedResponse<Company> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [viewing, setViewing] = useState<Company | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      setResult(
        await browserApiClient.companies.list({
          page,
          limit: 10,
          search: search || undefined,
        }),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setViewing(null);
    setForm(emptyForm);
    setFormError(null);
    setCreating(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setViewing(null);
    setForm({
      name: company.name,
      website: company.website ?? '',
      location: company.location ?? '',
      description: company.description ?? '',
    });
    setFormError(null);
    setCreating(true);
  }

  function closeDialog() {
    setCreating(false);
    setEditing(null);
    setViewing(null);
    setFormError(null);
  }

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      name: form.name,
      website: form.website || undefined,
      location: form.location || undefined,
      description: form.description || undefined,
    };

    try {
      if (editing) {
        await browserApiClient.companies.update(editing.id, payload);
      } else {
        await browserApiClient.companies.create(payload);
      }

      closeDialog();
      await load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Unable to save company');
    } finally {
      setSaving(false);
    }
  }

  async function removeCompany(company: Company) {
    if (!window.confirm(`Delete ${company.name}?`)) {
      return;
    }

    await browserApiClient.companies.remove(company.id);
    await load();
  }

  const companies = result?.data ?? [];
  const totalPages = result?.meta.totalPages ?? 0;

  return (
    <>
      <PageHeader
        title="Companies"
        description="Manage employers and their details."
        action={
          <button className="primary-button" type="button" onClick={openCreate}>
            New company
          </button>
        }
      />

      <section className="filter-bar" aria-label="Company search">
        <input
          type="search"
          aria-label="Search companies"
          placeholder="Search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </section>

      {loading ? <LoadingState label="Loading companies" /> : null}
      {error ? <ErrorState /> : null}
      {!loading && !error && companies.length === 0 ? (
        <EmptyState title="No companies" description="Create a company to get started." />
      ) : null}

      {!loading && !error && companies.length > 0 ? (
        <section className="application-list" aria-label="Companies">
          {companies.map((company) => (
            <article className="application-row" key={company.id}>
              <div>
                <strong className="row-title">{company.name}</strong>
                <p>
                  {[company.location, company.website].filter(Boolean).join(' · ') || 'No details'}
                </p>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => setViewing(company)}>
                  View
                </button>
                <button type="button" onClick={() => openEdit(company)}>
                  Edit
                </button>
                <button type="button" onClick={() => void removeCompany(company)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Company pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}

      {creating ? (
        <div className="dialog-backdrop">
          <form className="dialog" onSubmit={handleSubmit}>
            <h2>{editing ? 'Edit company' : 'New company'}</h2>

            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </label>

            <label>
              Website
              <input
                type="url"
                value={form.website}
                onChange={(event) => updateField('website', event.target.value)}
              />
            </label>

            <label>
              Location
              <input
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
              />
            </label>

            <label>
              Description
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>

            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="dialog-actions">
              <button type="button" onClick={closeDialog}>
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Saving' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {viewing ? (
        <div className="dialog-backdrop">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="company-title">
            <h2 id="company-title">{viewing.name}</h2>
            <dl className="detail-list">
              <dt>Website</dt>
              <dd>{viewing.website || 'Not provided'}</dd>
              <dt>Location</dt>
              <dd>{viewing.location || 'Not provided'}</dd>
              <dt>Description</dt>
              <dd>{viewing.description || 'Not provided'}</dd>
            </dl>
            <div className="dialog-actions">
              <button type="button" onClick={closeDialog}>
                Close
              </button>
              <button className="primary-button" type="button" onClick={() => openEdit(viewing)}>
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
