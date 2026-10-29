import { Flex, Skeleton } from 'antd';

import moneySendImg from '../../assets/icons/money-send2.svg';
import statusUpImg from '../../assets/icons/status-up2.svg';
import { CreditNoteDashboard } from '../../types/creditNote';
import { formatAmount } from '../../utils/helperFunctions';
import StatCard from '../shared/StatCard';

interface Props {
    dashboard: CreditNoteDashboard | null;
    loading: boolean;
}

const CreditNoteStatsRow = ({ dashboard, loading }: Props) => {
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
                value={String(dashboard?.totalCreditNotes ?? 0)}
                label="Total Credit Notes"
                bgColor="#FDF6F0"
                icon={statusUpImg}
            />
            <StatCard
                value={formatAmount(dashboard?.totalValue ?? '0')}
                label="Total Value"
                bgColor="#ECF0FC"
                icon={moneySendImg}
            />
        </Flex>
    );
};

export default CreditNoteStatsRow;
