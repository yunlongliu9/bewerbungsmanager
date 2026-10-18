import { ApplicationDetailView } from '../../../../components/application-detail-view';
import { AuthGuard } from '../../../../components/auth-guard';

export default function ApplicationDetailPage() {
  return (
    <AuthGuard>
      <ApplicationDetailView />
    </AuthGuard>
  );
}
