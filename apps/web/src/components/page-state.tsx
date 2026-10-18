import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
}: Readonly<{
  title: string;
  description: string;
  action?: ReactNode;
}>) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="page-actions">{action}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <div className="state-panel" role="status">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function LoadingState({ label = 'Loading' }: Readonly<{ label?: string }>) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="loading-indicator" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load',
  description = 'Try again or check the API connection.',
}: Readonly<{
  title?: string;
  description?: string;
}>) {
  return (
    <div className="state-panel state-panel-error" role="alert">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
