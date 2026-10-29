import { serviceWithoutPlansColumns } from '../components/services/serviceColumns';
import ServiceListPage from '../components/services/ServiceListPage';

const ServiceWithoutPlans = () => (
    <ServiceListPage
        kind="without_plans"
        intro="Services classified as without plans in Settings › Service Classification. Open a service to configure its commission, platform fee, cashbacks and vendor."
        columns={serviceWithoutPlansColumns}
    />
);

export default ServiceWithoutPlans;
