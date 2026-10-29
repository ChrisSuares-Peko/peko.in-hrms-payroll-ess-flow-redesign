import { Flex } from 'antd';

import Contact from '../components/EmployeeProfile/Contact';
import ProfileTabs from '../components/EmployeeProfile/ProfileTabs';

const EmployeeOnboardPage = () => (
    <Flex vertical className=" sm:px-6">
        <Contact />
        <ProfileTabs />
    </Flex>
);

export default EmployeeOnboardPage;
