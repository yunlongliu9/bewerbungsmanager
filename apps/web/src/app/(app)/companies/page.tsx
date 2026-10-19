import { AuthGuard } from '../../../components/auth-guard';
import { CompaniesView } from '../../../components/companies-view';

export default function CompaniesPage() {
  return (
    <AuthGuard>
      <CompaniesView />
    </AuthGuard>
  );
}
