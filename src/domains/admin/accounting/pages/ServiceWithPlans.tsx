import { serviceWithPlansColumns } from '../components/services/serviceColumns';
import ServiceListPage from '../components/services/ServiceListPage';

const ServiceWithPlans = () => (
    <ServiceListPage
        kind="with_plans"
        intro="Services classified as with plans in Settings › Service Classification. Open a service to configure commissions per plan, platform fee, cashbacks and vendor."
        columns={serviceWithPlansColumns}
    />
);

export default ServiceWithPlans;
