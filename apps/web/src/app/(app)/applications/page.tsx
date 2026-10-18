import { ApplicationsView } from '../../../components/applications-view';
import { AuthGuard } from '../../../components/auth-guard';

export default function ApplicationsPage() {
  return (
    <AuthGuard>
      <ApplicationsView />
    </AuthGuard>
  );
}
