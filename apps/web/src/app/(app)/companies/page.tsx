import { EmptyState, PageHeader } from '../../../components/page-state';

export default function CompaniesPage() {
  return (
    <>
      <PageHeader title="Companies" description="Manage employers and their details." />
      <EmptyState
        title="No companies"
        description="Company records will appear here after the API client is connected."
      />
    </>
  );
}
