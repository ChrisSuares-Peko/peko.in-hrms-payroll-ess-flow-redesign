import { Flex, Skeleton } from 'antd';

import moneySendImg from '../../assets/icons/money-send2.svg';
import statusUpImg from '../../assets/icons/status-up2.svg';
import { formatAmount } from '../../utils/helperFunctions';
import StatCard from '../shared/StatCard';

interface Props {
    totalReceived: number;
    totalPayments: number;
    loading: boolean;
}

const PaymentsReceivedStatsRow = ({ totalReceived, totalPayments, loading }: Props) => {
    if (loading) {
        return (
            <Flex gap={16} wrap="wrap" className="mb-6">
                {[1, 2].map(i => (
                    <Skeleton.Button key={i} active block className="h-24 rounded-xl flex-1" />
                ))}
            </Flex>
        );
    }

    return (
        <Flex gap={16} wrap="wrap" className="mb-6">
            <StatCard
                value={String(totalPayments)}
                label="Total Payments"
                bgColor="#FDF6F0"
                icon={statusUpImg}
            />
            <StatCard
                value={formatAmount(totalReceived)}
                label="Total Received"
                bgColor="#ECF0FC"
                icon={moneySendImg}
            />
        </Flex>
    );
};

export default PaymentsReceivedStatsRow;
