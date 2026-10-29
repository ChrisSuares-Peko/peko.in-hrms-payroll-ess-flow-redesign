import { Flex } from 'antd';

import BusinessRegistrationReport from '@src/domains/admin/reports/components/BusinessRegistration';

// Admin tracking tab for Business Registration applications. Pricing lives in the
// Settings → Business Registration Catalog tab, so no config drawer here.
const BusinessRegistration = () => (
    <Flex vertical gap={20}>
        <BusinessRegistrationReport />
    </Flex>
);

export default BusinessRegistration;
