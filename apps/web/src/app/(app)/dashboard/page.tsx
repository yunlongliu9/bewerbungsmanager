import { EmptyState, PageHeader } from '../../../components/page-state';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A summary of active applications, interviews, and follow-ups."
      />
      <EmptyState
        title="No dashboard data"
        description="Dashboard metrics will appear after authentication and backend data are connected."
      />
    </>
  );
}
