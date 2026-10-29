import AuditTrailModal from './AuditTrailModal';
import { useDashboardNav } from '../common/dashboardNav';

/** Renders the AuditTrailModal auto-opened; navigates back to dashboard on close. */
const AuditTrailTrigger = () => {
    const navigate = useDashboardNav();
    return <AuditTrailModal open onClose={() => navigate('dashboard')} />;
};

export default AuditTrailTrigger;
