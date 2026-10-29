import { FileTextOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

const InvoiceEmptyState = () => (
    <Flex
        vertical
        align="center"
        justify="center"
        gap={16}
        className="w-full border border-dashed border-gray-300 rounded-2xl p-8 bg-gray-50 min-h-[260px]"
    >
        <Flex align="center" justify="center" className="w-12 h-12 rounded-full bg-gray-100">
            <FileTextOutlined className="text-xl text-gray-400" />
        </Flex>
        <Flex vertical align="center" gap={4}>
            <Typography.Text className="text-gray-700 text-base font-medium">
                No Invoice Available
            </Typography.Text>
            <Typography.Text className="text-gray-400 text-sm">
                Invoice details will appear here once generated.
            </Typography.Text>
        </Flex>
    </Flex>
);

export default InvoiceEmptyState;
