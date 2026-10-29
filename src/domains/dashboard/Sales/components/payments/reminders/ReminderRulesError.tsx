import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

const ReminderRulesError = () => (
    <Flex
        align="center"
        justify="center"
        vertical
        gap={8}
        className="py-10 rounded-xl border border-[#E4E4E7] bg-white"
    >
        <ExclamationCircleOutlined className="text-2xl text-[#D1D5DB]" />
        <Typography.Text className="text-sm text-[#6B7280]">
            Failed to load reminder rules
        </Typography.Text>
    </Flex>
);

export default ReminderRulesError;
