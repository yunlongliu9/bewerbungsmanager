'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  browserApiClient,
  type Application,
  type ApplicationStatus,
  type Company,
  type EmploymentType,
  type PaginatedResponse,
  type Priority,
  type WorkMode,
} from '../lib/api';
import { EmptyState, ErrorState, LoadingState, PageHeader } from './page-state';

const statuses: ApplicationStatus[] = [
  'WISHLIST',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'ACCEPTED',
];

type FormState = {
  companyId: string;
  jobTitle: string;
  jobPostingUrl: string;
  appliedAt: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  priority: Priority;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  deadline: string;
  nextActionAt: string;
  source: string;
  jobDescriptionSnapshot: string;
};

const emptyForm: FormState = {
  companyId: '',
  jobTitle: '',
  jobPostingUrl: '',
  appliedAt: '',
  employmentType: 'FULL_TIME',
  workMode: 'UNSPECIFIED',
  priority: 'NORMAL',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: '',
  deadline: '',
  nextActionAt: '',
  source: '',
  jobDescriptionSnapshot: '',
};

export function ApplicationsView() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [result, setResult] = useState<PaginatedResponse<Application> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const [applicationResponse, companyResponse] = await Promise.all([
        browserApiClient.applications.list({
          page,
          limit: 10,
          search: search || undefined,
          status: status || undefined,
          companyId: companyId || undefined,
        }),
        browserApiClient.companies.list({ page: 1, limit: 100 }),
      ]);
      setResult(applicationResponse);
      setCompanies(companyResponse.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [companyId, page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function openEdit(application: Application) {
    setEditing(application);
    setCreating(true);
    setForm({
      companyId: application.companyId,
      jobTitle: application.jobTitle,
      jobPostingUrl: application.jobPostingUrl ?? '',
      appliedAt: application.appliedAt.slice(0, 10),
      employmentType: application.employmentType,
      workMode: application.workMode,
      priority: application.priority,
      salaryMin: application.salaryMin?.toString() ?? '',
      salaryMax: application.salaryMax?.toString() ?? '',
      salaryCurrency: application.salaryCurrency ?? '',
      deadline: application.deadline?.slice(0, 10) ?? '',
      nextActionAt: application.nextActionAt ?? '',
      source: application.source ?? '',
      jobDescriptionSnapshot: application.jobDescriptionSnapshot ?? '',
    });
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
      companyId: form.companyId,
      jobTitle: form.jobTitle,
      jobPostingUrl: form.jobPostingUrl || undefined,
      appliedAt: form.appliedAt ? new Date(form.appliedAt).toISOString() : undefined,
      employmentType: form.employmentType,
      workMode: form.workMode,
      priority: form.priority,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      salaryCurrency: form.salaryCurrency || undefined,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      nextActionAt: form.nextActionAt || undefined,
      source: form.source || undefined,
      jobDescriptionSnapshot: form.jobDescriptionSnapshot || undefined,
    };

    try {
      if (editing) {
        await browserApiClient.applications.update(editing.id, payload);
      } else {
        await browserApiClient.applications.create(payload);
      }

      setCreating(false);
      setEditing(null);
      await load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Unable to save application');
    } finally {
      setSaving(false);
    }
  }

  async function archive(application: Application) {
    if (!window.confirm(`Archive ${application.jobTitle}?`)) {
      return;
    }

    await browserApiClient.applications.archive(application.id);
    await load();
  }

  const totalPages = result?.meta.totalPages ?? 0;

  const applicationList = useMemo(() => result?.data ?? [], [result]);

  return (
    <>
      <PageHeader
        title="Applications"
        description="Track every application and its next action."
        action={
          <button className="primary-button" type="button" onClick={openCreate}>
            New application
          </button>
        }
      />

      <section className="filter-bar" aria-label="Application filters">
        <input
          type="search"
          aria-label="Search applications"
          placeholder="Search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Status filter"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ApplicationStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
        <select
          aria-label="Company filter"
          value={companyId}
          onChange={(event) => {
            setCompanyId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </section>

      {loading ? <LoadingState label="Loading applications" /> : null}
      {error ? <ErrorState /> : null}
      {!loading && !error && applicationList.length === 0 ? (
        <EmptyState title="No applications" description="Create an application to get started." />
      ) : null}

      {!loading && !error && applicationList.length > 0 ? (
        <section className="application-list" aria-label="Applications">
          {applicationList.map((application) => (
            <article className="application-row" key={application.id}>
              <div>
                <Link className="row-title" href={`/applications/${application.id}`}>
                  {application.jobTitle}
                </Link>
                <p>
                  {application.company?.name} · {application.status.replaceAll('_', ' ')}
                </p>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => openEdit(application)}>
                  Edit
                </button>
                <button type="button" onClick={() => void archive(application)}>
                  Archive
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Application pagination">
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
            <h2>{editing ? 'Edit application' : 'New application'}</h2>

            <label>
              Company
              <select
                required
                value={form.companyId}
                onChange={(event) => updateField('companyId', event.target.value)}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Job title
              <input
                required
                value={form.jobTitle}
                onChange={(event) => updateField('jobTitle', event.target.value)}
              />
            </label>

            <label>
              Posting URL
              <input
                type="url"
                value={form.jobPostingUrl}
                onChange={(event) => updateField('jobPostingUrl', event.target.value)}
              />
            </label>

            <div className="form-grid">
              <label>
                Employment type
                <select
                  value={form.employmentType}
                  onChange={(event) =>
                    updateField('employmentType', event.target.value as EmploymentType)
                  }
                >
                  {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'OTHER'].map(
                    (item) => (
                      <option key={item} value={item}>
                        {item.replaceAll('_', ' ')}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Work mode
                <select
                  value={form.workMode}
                  onChange={(event) => updateField('workMode', event.target.value as WorkMode)}
                >
                  {['ONSITE', 'HYBRID', 'REMOTE', 'UNSPECIFIED'].map((item) => (
                    <option key={item} value={item}>
                      {item.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(event) => updateField('priority', event.target.value as Priority)}
                >
                  {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Applied date
                <input
                  type="date"
                  value={form.appliedAt}
                  onChange={(event) => updateField('appliedAt', event.target.value)}
                />
              </label>
              <label>
                Deadline
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(event) => updateField('deadline', event.target.value)}
                />
              </label>
              <label>
                Next action
                <input
                  type="datetime-local"
                  value={form.nextActionAt}
                  onChange={(event) => updateField('nextActionAt', event.target.value)}
                />
              </label>
              <label>
                Salary min
                <input
                  type="number"
                  value={form.salaryMin}
                  onChange={(event) => updateField('salaryMin', event.target.value)}
                />
              </label>
              <label>
                Salary max
                <input
                  type="number"
                  value={form.salaryMax}
                  onChange={(event) => updateField('salaryMax', event.target.value)}
                />
              </label>
              <label>
                Currency
                <input
                  maxLength={3}
                  value={form.salaryCurrency}
                  onChange={(event) =>
                    updateField('salaryCurrency', event.target.value.toUpperCase())
                  }
                />
              </label>
              <label>
                Source
                <input
                  value={form.source}
                  onChange={(event) => updateField('source', event.target.value)}
                />
              </label>
            </div>

            <label>
              Job description snapshot
              <textarea
                rows={4}
                value={form.jobDescriptionSnapshot}
                onChange={(event) => updateField('jobDescriptionSnapshot', event.target.value)}
              />
            </label>

            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="dialog-actions">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Saving' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
