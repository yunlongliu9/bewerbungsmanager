import { EmptyState, PageHeader } from '../../../components/page-state';

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader title="Applications" description="Track jobs, status, and next actions." />
      <EmptyState
        title="No applications"
        description="Application records will appear here after the API client is connected."
      />
    </>
  );
}
