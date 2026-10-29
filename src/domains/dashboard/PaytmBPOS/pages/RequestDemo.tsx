import { Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';

import RequestDetails from '../components/RequestDetails';
import RequestHeader from '../components/RequestHeader';

const RequestDemo = () => (
    <Content className="px-0 sm:px-6">
        <Flex vertical gap={40}>
            <RequestHeader />
            <RequestDetails />
        </Flex>
    </Content>
);

export default RequestDemo;
