import { EmptyState, PageHeader } from '../../../components/page-state';

export default function InterviewsPage() {
  return (
    <>
      <PageHeader title="Interviews" description="Schedule and review interviews." />
      <EmptyState
        title="No interviews"
        description="Interview records will appear here after the API client is connected."
      />
    </>
  );
}
