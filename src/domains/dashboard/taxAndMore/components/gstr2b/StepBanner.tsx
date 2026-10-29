import { CalendarOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

interface Props {
    periodLabel: string;
}

const StepBanner = ({ periodLabel }: Props) => (
    <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={8}
        className="border border-[#81cf92] rounded-[14px] px-4 sm:px-6 py-3"
        style={{ backgroundColor: '#ecfdf5' }}
    >
        <Flex gap={6} align="center" wrap="wrap">
            <CalendarOutlined style={{ fontSize: 14, color: '#43b75d' }} />
            <Typography.Text className="text-xs font-medium" style={{ color: '#43b75d' }}>
                Step 4 of 6 — Reconcile GSTR-2B
            </Typography.Text>
            <Typography.Text className="text-[11px]" style={{ color: '#43b75d' }}>
                Completed ✓
            </Typography.Text>
        </Flex>
        <Typography.Text className="text-xs font-medium" style={{ color: '#475569' }}>
            {periodLabel}
        </Typography.Text>
    </Flex>
);

export default StepBanner;
