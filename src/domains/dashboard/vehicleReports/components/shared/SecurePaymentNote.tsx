import { LockOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

// Small-print reassurance row above the Pay button on every report form.
const SecurePaymentNote = () => (
    <Flex align="center" gap={6} className="rounded-lg bg-[#F7F8FA] px-3 py-2">
        <LockOutlined className="shrink-0 text-[10px] text-[#98A2B3]" />
        <Typography.Text className="text-[11px] leading-4 text-[#98A2B3]">
            Secure payment · Refunded in full if the report can&apos;t be generated
        </Typography.Text>
    </Flex>
);

export default SecurePaymentNote;
