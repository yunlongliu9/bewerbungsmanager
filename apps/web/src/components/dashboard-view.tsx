'use client';

import { useEffect, useState } from 'react';
import { browserApiClient, type DashboardData } from '../lib/api';
import { EmptyState, ErrorState, LoadingState, PageHeader } from './page-state';

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'No date';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    browserApiClient.dashboard
      .get()
      .then((response) => {
        if (active) {
          setData(response);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard" />;
  }

  if (error) {
    return <ErrorState />;
  }

  if (!data) {
    return (
      <EmptyState title="No dashboard data" description="No dashboard response was returned." />
    );
  }

  const hasApplications =
    data.activeApplicationCount > 0 ||
    data.recentlyUpdatedApplications.length > 0 ||
    data.dueFollowUps.length > 0 ||
    data.overdueFollowUps.length > 0;

  return (
    <>
      <PageHeader title="Dashboard" description="Your active job search at a glance." />

      <section className="metric-grid" aria-label="Application metrics">
        <article className="metric-card">
          <strong>{data.activeApplicationCount}</strong>
          <span>Active applications</span>
        </article>
        <article className="metric-card">
          <strong>{data.upcomingInterviews.length}</strong>
          <span>Upcoming interviews</span>
        </article>
        <article className="metric-card">
          <strong>{data.dueFollowUps.length}</strong>
          <span>Due follow-ups</span>
        </article>
        <article className="metric-card">
          <strong>{data.overdueFollowUps.length}</strong>
          <span>Overdue follow-ups</span>
        </article>
      </section>

      <section className="status-grid" aria-label="Applications by status">
        {Object.entries(data.applicationsByStatus).map(([status, count]) => (
          <div className="status-row" key={status}>
            <span>{status.replaceAll('_', ' ')}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </section>

      {!hasApplications ? (
        <EmptyState
          title="No application data"
          description="Create your first application to see activity here."
        />
      ) : null}

      {data.upcomingInterviews.length > 0 ? (
        <section className="section-list" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading">Upcoming interviews</h2>
          {data.upcomingInterviews.map((interview) => (
            <article className="list-row" key={interview.id}>
              <strong>{interview.application?.jobTitle ?? 'Application'}</strong>
              <span>{formatDate(interview.scheduledAt)}</span>
            </article>
          ))}
        </section>
      ) : null}

      {data.dueFollowUps.length > 0 ? (
        <section className="section-list" aria-labelledby="due-heading">
          <h2 id="due-heading">Due follow-ups</h2>
          {data.dueFollowUps.map((application) => (
            <article className="list-row" key={application.id}>
              <strong>{application.jobTitle}</strong>
              <span>{formatDate(application.nextActionAt)}</span>
            </article>
          ))}
        </section>
      ) : null}

      {data.overdueFollowUps.length > 0 ? (
        <section className="section-list" aria-labelledby="overdue-heading">
          <h2 id="overdue-heading">Overdue follow-ups</h2>
          {data.overdueFollowUps.map((application) => (
            <article className="list-row" key={application.id}>
              <strong>{application.jobTitle}</strong>
              <span>{formatDate(application.nextActionAt)}</span>
            </article>
          ))}
        </section>
      ) : null}
    </>
  );
}
