import { EmptyState, PageHeader } from '../../../components/page-state';

export default function ContactsPage() {
  return (
    <>
      <PageHeader title="Contacts" description="Manage people at companies." />
      <EmptyState
        title="No contacts"
        description="Contact records will appear here after the API client is connected."
      />
    </>
  );
}
