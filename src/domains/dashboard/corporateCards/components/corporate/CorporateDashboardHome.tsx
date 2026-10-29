import { useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Skeleton, Typography } from 'antd';

import { formattedDateOnly } from '@utils/dateFormat';

import MyCardsPanel from './MyCardsPanel';
import { DashboardRecentTransaction } from '../../api/user/dashboardApi';
import categoryIcon from '../../assets/icons/category.svg';
import moneySendIcon from '../../assets/icons/money-send.svg';
import moneysIcon from '../../assets/icons/moneys.svg';
import moneyTimeIcon from '../../assets/icons/moneytime.svg';
import transactionIcon from '../../assets/icons/transaction.svg';
import { useCardsApi } from '../../hooks/user/useCardsApi';
import { useDashboardSummaryApi } from '../../hooks/user/useDashboardSummaryApi';
import { categoryColor } from '../../utils/dashboardMappers';
import { formatRupeesDecimal, recentTransactionStatus } from '../../utils/helpers';
import { MyCard, StatItem, TransactionItem } from '../../utils/types';
import { useDashboardNav } from '../common/dashboardNav';
import ProgressList, { ProgressRow } from '../common/ProgressList';
import RecentTransactions from '../common/RecentTransactions';
import SectionCard, { ViewAllLink } from '../common/SectionCard';
import StatCard from '../common/StatCard';
import StatCardSkeleton from '../common/StatCardSkeleton';
import LimitIncreaseModal from '../landingPage/myCards/LimitIncreaseModal';
import RequestNewCardModal from '../landingPage/myCards/RequestNewCardModal';
import RequestTopupModal from '../landingPage/myCards/RequestTopupModal';

const { Title, Text } = Typography;

const toRecentItem = (t: DashboardRecentTransaction): TransactionItem => ({
    key: String(t.id),
    merchant: t.merchant,
    avatarText: t.merchant.charAt(0).toUpperCase(),
    person: t.member ?? '—',
    date: t.date ? formattedDateOnly(new Date(t.date)) : '—',
    amount: formatRupeesDecimal(t.amount),
    status: recentTransactionStatus(t.status),
});

const SectionEmpty = ({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) => (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-listBg">
            <img src={icon} alt="" className="h-7 w-7" />
        </div>
        <div className="flex flex-col gap-1">
            <Text className="text-sm font-semibold text-textHeadings">{title}</Text>
            <Text className="max-w-[200px] text-xs text-textBody">{description}</Text>
        </div>
    </div>
);

/** "Dashboard" tab content for the cardholder view. */
const CorporateDashboardHome = () => {
    const navigate = useDashboardNav();
    const { cards, isLoading: cardsLoading, refetch } = useCardsApi();
    const { summary, isLoading: summaryLoading } = useDashboardSummaryApi();
    const [newCardOpen, setNewCardOpen] = useState(false);
    const [topupOpen, setTopupOpen] = useState(false);
    const [topupCard, setTopupCard] = useState<MyCard | null>(null);

    const kpis = summary?.kpis;
    const activeCardCount = cards.filter(
        c => c.status === 'Active' && !c.terminationRequested
    ).length;
    const frozenCardCount = cards.filter(
        c => c.status === 'Frozen' && !c.terminationRequested
    ).length;
    const myCardsPanelCards = cards.filter(
        c => (c.status === 'Active' || c.status === 'Frozen') && !c.terminationRequested
    );
    const stats: StatItem[] = [
        {
            key: 'my-cards',
            icon: 'card',
            svgIcon: moneysIcon,
            label: 'My cards',
            value: `${cards.length}`,
            caption: `${activeCardCount} active`,
            tone: 'lilac',
        },
        {
            key: 'spent',
            icon: 'bank',
            svgIcon: moneySendIcon,
            label: 'Spent this period',
            value: formatRupeesDecimal(kpis?.spentThisMonth ?? 0),
            caption: `of ${formatRupeesDecimal(kpis?.totalCardLimits ?? 0)} limit`,
            tone: 'mint',
        },
        {
            key: 'open-requests',
            icon: 'clock',
            label: 'Open requests',
            value: `${kpis?.openRequests ?? 0}`,
            caption: 'Card & top-up requests',
            tone: 'lavender',
        },
        {
            key: 'pending-reimbursements',
            icon: 'reimbursement',
            svgIcon: moneyTimeIcon,
            label: 'Pending reimbursements',
            value: formatRupeesDecimal(0),
            caption: '0 awaiting approval',
            tone: 'rose',
        },
    ];

    const liveCategories = summary?.spendByCategory ?? [];
    const totalCategorySpend = liveCategories.reduce((sum, c) => sum + c.amount, 0);
    const spendRows: ProgressRow[] = liveCategories.map((item, index) => {
        const percent =
            totalCategorySpend > 0 ? Math.round((item.amount / totalCategorySpend) * 100) : 0;
        return {
            key: item.category,
            label: item.category,
            valueText: `${formatRupeesDecimal(item.amount)} · ${percent}%`,
            percent,
            color: categoryColor(index),
        };
    });

    const renderRecentTransactions = () => {
        if (summaryLoading) return <Skeleton active paragraph={{ rows: 5 }} />;
        if ((summary?.recentTransactions ?? []).length === 0) {
            return (
                <SectionEmpty
                    icon={transactionIcon}
                    title="No transactions yet"
                    description="Your transaction history will appear here once you start using your Peko card."
                />
            );
        }
        return (
            <RecentTransactions
                items={summary!.recentTransactions!.slice(0, 6).map(toRecentItem)}
            />
        );
    };

    const renderSpendByCategory = () => {
        if (summaryLoading) return <Skeleton active paragraph={{ rows: 5 }} />;
        if (spendRows.length === 0) {
            return (
                <SectionEmpty
                    icon={categoryIcon}
                    title="No spend data available"
                    description="We don't have enough data to generate category insights yet. Check back soon!"
                />
            );
        }
        return <ProgressList rows={spendRows} />;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Title level={3} className="!mb-0 !text-textHeadings">
                    Corporate Card
                </Title>
                <div className="flex flex-wrap gap-3">
                    <Button
                        icon={<PlusOutlined />}
                        className="!border-textLightRed !text-textLightRed hover:!border-textLightRed hover:!text-textLightRed"
                        onClick={() => setTopupOpen(true)}
                    >
                        Request Limit Increase
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setNewCardOpen(true)}
                    >
                        New card request
                    </Button>
                </div>
            </div>

            <div className="grid mt-3 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
                {cardsLoading || summaryLoading
                    ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                    : stats.map(stat => <StatCard key={stat.key} stat={stat} />)}
            </div>

            <div className="grid mt-4 grid-cols-1 gap-6 md:grid-cols-3">
                <SectionCard
                    title="Recent Transactions"
                    action={<ViewAllLink onClick={() => navigate('transactions')} />}
                    className="min-h-[360px]"
                >
                    {renderRecentTransactions()}
                </SectionCard>

                <SectionCard
                    title="Spend by Category"
                    action={<ViewAllLink onClick={() => navigate('transactions')} />}
                    className="min-h-[360px]"
                >
                    {renderSpendByCategory()}
                </SectionCard>

                <MyCardsPanel
                    cards={myCardsPanelCards}
                    activeCount={activeCardCount}
                    frozenCount={frozenCardCount}
                    onTopup={setTopupCard}
                    loading={cardsLoading}
                />
            </div>

            <RequestNewCardModal
                open={newCardOpen}
                onClose={() => setNewCardOpen(false)}
                onSuccess={refetch}
            />
            <RequestTopupModal
                open={topupOpen}
                onClose={() => setTopupOpen(false)}
                onSuccess={refetch}
            />
            <LimitIncreaseModal
                card={topupCard}
                onClose={() => setTopupCard(null)}
                onSuccess={refetch}
            />
        </div>
    );
};

export default CorporateDashboardHome;
