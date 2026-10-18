import { AuthGuard } from '../../../components/auth-guard';
import { DashboardView } from '../../../components/dashboard-view';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardView />
    </AuthGuard>
  );
}
