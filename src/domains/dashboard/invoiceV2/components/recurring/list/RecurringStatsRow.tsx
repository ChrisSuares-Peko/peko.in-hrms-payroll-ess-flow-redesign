import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import moneySendIcon from '../../../assets/icons/money-send2.svg';
import statusUpIcon from '../../../assets/icons/status-up.svg';
import statusUp2Icon from '../../../assets/icons/status-up2.svg';

interface RecurringStatsRowProps {
    totalSchedule: number;
    active: number;
    revenueGenerated: number;
    isLoading?: boolean;
}

const StatBox = ({
    label,
    value,
    bg,
    icon,
}: {
    label: string;
    value: React.ReactNode;
    bg: string;
    icon: string;
}) => (
    <Flex
        vertical
        gap={12}
        className="flex-1 rounded-xl px-4 py-4 md:px-5 min-w-0"
        style={{ backgroundColor: bg }}
    >
        <Flex align="center" justify="center" className="w-9 h-9 bg-white rounded-full self-start">
            <ReactSVG src={icon} />
        </Flex>
        <Flex vertical gap={4}>
            <Typography.Text className="text-[#475569] text-sm font-normal leading-5">
                {label}
            </Typography.Text>
            <Typography.Text className="text-[#1E293B] text-xl font-semibold leading-7">
                {value}
            </Typography.Text>
        </Flex>
    </Flex>
);

const RecurringStatsRow = ({
    totalSchedule,
    active,
    revenueGenerated,
    isLoading = false,
}: RecurringStatsRowProps) => (
    <Row gutter={[16, 16]} className="mb-5">
        <Col xs={24} sm={8}>
            <StatBox
                label="Total Schedules"
                icon={statusUp2Icon}
                value={isLoading ? <Skeleton.Input size="small" active /> : totalSchedule.toString()}
                bg="#FDF6F0"
            />
        </Col>
        <Col xs={24} sm={8}>
            <StatBox
                label="Active"
                icon={moneySendIcon}
                value={isLoading ? <Skeleton.Input size="small" active /> : active.toString()}
                bg="#ECF0FC"
            />
        </Col>
        <Col xs={24} sm={8}>
            <StatBox
                label="Revenue Generated"
                icon={statusUpIcon}
                value={
                    isLoading ? (
                        <Skeleton.Input size="small" active />
                    ) : (
                        `₹${parseFloat(String(revenueGenerated) || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    )
                }
                bg="#F1FFF6"
            />
        </Col>
    </Row>
);

export default RecurringStatsRow;
