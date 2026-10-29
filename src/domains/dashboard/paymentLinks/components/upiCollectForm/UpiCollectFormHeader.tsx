import { Flex, Typography } from 'antd';

const UpiCollectFormHeader = () => (
    <Flex vertical gap={4}>
        <Typography.Title level={4} className="!mb-0 !font-bold">
            Send UPI Collect
        </Typography.Title>
        <Typography.Text className="text-gray-500">
            Customer will receive a payment request in their UPI app
        </Typography.Text>
    </Flex>
);

export default UpiCollectFormHeader;
