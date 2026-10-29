import { Flex, Skeleton } from 'antd';

import walletImg from '../../assets/icons/empty-wallet.svg';
import moneySendImg from '../../assets/icons/money-send2.svg';
import statusUpImg from '../../assets/icons/status-up2.svg';
import { QuotationDashboard } from '../../types/invoice';
import StatCard from '../shared/StatCard';

interface Props {
    dashboard: QuotationDashboard | null;
    loading: boolean;
}

const QuotationStatsRow = ({ dashboard, loading }: Props) => {
    if (loading) {
        return (
            <Flex gap={16} wrap="wrap" className="mb-6">
                {[1, 2, 3].map(i => (
                    <Skeleton.Button key={i} active block className="h-24 rounded-xl flex-1" />
                ))}
            </Flex>
        );
    }

    return (
        <Flex gap={16} wrap="wrap" className="mb-6">
            <StatCard
                value={String(dashboard?.totalQuotations ?? 0)}
                label="Total Quotations"
                bgColor="#FDF6F0"
                icon={statusUpImg}
            />
            <StatCard
                value={String(dashboard?.accepted ?? 0)}
                label="Accepted"
                bgColor="#ECF0FC"
                icon={walletImg}
            />
            <StatCard
                value={String(dashboard?.pending ?? 0)}
                label="Pending"
                bgColor="#EBF6F1"
                icon={moneySendImg}
            />
        </Flex>
    );
};

export default QuotationStatsRow;
