import { EmptyState, PageHeader } from '../../../components/page-state';

export default function NotesPage() {
  return (
    <>
      <PageHeader title="Notes" description="Keep context attached to any record." />
      <EmptyState
        title="No notes"
        description="Notes will appear here after the API client is connected."
      />
    </>
  );
}
