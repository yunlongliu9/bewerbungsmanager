'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { browserApiClient, type Application, type ApplicationStatus } from '../lib/api';
import { ErrorState, LoadingState, PageHeader } from './page-state';

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

export function ApplicationDetailView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>('WISHLIST');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await browserApiClient.applications.get(params.id);
      setApplication(response);
      setStatus(response.status);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatusTransition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setTransitionError(null);

    try {
      await browserApiClient.applications.changeStatus(params.id, {
        status,
        note: note || undefined,
      });
      setNote('');
      await load();
    } catch (caught) {
      setTransitionError(caught instanceof Error ? caught.message : 'Unable to change status');
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!application || !window.confirm(`Archive ${application.jobTitle}?`)) {
      return;
    }

    await browserApiClient.applications.archive(application.id);
    router.push('/applications');
  }

  if (loading) {
    return <LoadingState label="Loading application" />;
  }

  if (error || !application) {
    return (
      <ErrorState
        title="Application not found"
        description="The application could not be loaded."
      />
    );
  }

  return (
    <>
      <PageHeader
        title={application.jobTitle}
        description={application.company?.name ?? 'Company unavailable'}
        action={
          <button className="secondary-button" type="button" onClick={() => void archive()}>
            Archive
          </button>
        }
      />

      <Link className="back-link" href="/applications">
        Back to applications
      </Link>

      <section className="detail-grid">
        <div className="detail-panel">
          <h2>Details</h2>
          <dl>
            <dt>Status</dt>
            <dd>{application.status.replaceAll('_', ' ')}</dd>
            <dt>Employment</dt>
            <dd>{application.employmentType.replaceAll('_', ' ')}</dd>
            <dt>Work mode</dt>
            <dd>{application.workMode.replaceAll('_', ' ')}</dd>
            <dt>Priority</dt>
            <dd>{application.priority}</dd>
            {application.salaryCurrency ? (
              <>
                <dt>Salary</dt>
                <dd>
                  {application.salaryMin ?? '?'} - {application.salaryMax ?? '?'}{' '}
                  {application.salaryCurrency}
                </dd>
              </>
            ) : null}
            {application.jobPostingUrl ? (
              <>
                <dt>Posting</dt>
                <dd>
                  <a href={application.jobPostingUrl} target="_blank" rel="noreferrer">
                    Open posting
                  </a>
                </dd>
              </>
            ) : null}
          </dl>
        </div>

        <div className="detail-panel">
          <h2>Change status</h2>
          <form className="status-form" onSubmit={handleStatusTransition}>
            <label>
              New status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Note
              <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            {transitionError ? (
              <p className="form-error" role="alert">
                {transitionError}
              </p>
            ) : null}
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving' : 'Save status'}
            </button>
          </form>
        </div>
      </section>

      <section className="history-panel" aria-labelledby="history-heading">
        <h2 id="history-heading">Status history</h2>
        {application.statusChanges && application.statusChanges.length > 0 ? (
          <ol>
            {application.statusChanges.map((change) => (
              <li key={change.id}>
                <strong>
                  {change.fromStatus.replaceAll('_', ' ')} → {change.toStatus.replaceAll('_', ' ')}
                </strong>
                <span>{new Date(change.changedAt).toLocaleString()}</span>
                {change.note ? <p>{change.note}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">No status changes yet.</p>
        )}
      </section>
    </>
  );
}
