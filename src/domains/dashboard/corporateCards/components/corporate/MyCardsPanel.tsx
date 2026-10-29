import { useState } from 'react';

import { Button, Skeleton, Typography } from 'antd';

import noCardIcon from '../../assets/icons/noCard.svg';
import { formatRupees, utilisationPercent } from '../../utils/helpers';
import { MyCard } from '../../utils/types';
import CardCarousel from '../common/CardCarousel';
import { useDashboardNav } from '../common/dashboardNav';
import SectionCard, { ViewAllLink } from '../common/SectionCard';

const { Text } = Typography;

interface MyCardsPanelProps {
    cards: MyCard[];
    activeCount: number;
    frozenCount?: number;
    /** Override the "View all cards" action; defaults to opening the Cards tab. */
    onViewAll?: () => void;
    /** Opens the limit-increase request for the currently visible card. */
    onTopup?: (card: MyCard) => void;
    /** Cards are still loading — show a placeholder instead of the "no cards" empty state. */
    loading?: boolean;
}

/** Cardholder "My Cards" panel: swipeable card carousel + balance, utilisation and actions. */
const MyCardsPanel = ({
    cards,
    activeCount,
    frozenCount = 0,
    onViewAll,
    onTopup,
    loading,
}: MyCardsPanelProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useDashboardNav();

    const handleViewAll = onViewAll ?? (() => navigate('cards'));

    const handleViewDetails = () => {
        const card = cards[activeIndex];
        if (card?.cardViewLink) window.open(card.cardViewLink, '_blank', 'noopener,noreferrer');
    };

    const activeCard = cards[activeIndex] ?? cards[0];
    const isFrozen = activeCard?.status === 'Frozen';
    const balanceRemaining = activeCard ? Math.max(activeCard.limit - activeCard.used, 0) : 0;

    if (loading) {
        return (
            <SectionCard
                title="My Cards"
                badge={`(${activeCount} Active + ${frozenCount} Frozen)`}
                action={<ViewAllLink label="View all" onClick={handleViewAll} />}
            >
                <Skeleton active paragraph={{ rows: 8 }} />
            </SectionCard>
        );
    }

    return (
        <SectionCard
            title="My Cards"
            badge={`( ${activeCount} Active + ${frozenCount} Frozen )`}
            action={<ViewAllLink label="View all" onClick={handleViewAll} />}
        >
            {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-listBg">
                        <img src={noCardIcon} alt="" className="h-7 w-7" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Text className="text-base font-bold text-textHeadings">
                            No cards found
                        </Text>
                        <Text className="max-w-[220px] text-sm text-textBody">
                            No cards available to display insights. Please request for a new card
                        </Text>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <CardCarousel cards={cards} onActiveIndexChange={setActiveIndex} />

                    <div className="flex flex-col items-center gap-1">
                        <Text className="text-sm text-textBody">Balance Remaining</Text>
                        <Text className="text-2xl font-semibold text-textHeadings xl:text-3xl">
                            {activeCard && formatRupees(balanceRemaining)}
                        </Text>
                    </div>

                    {activeCard && (
                        <div className="flex flex-col gap-2">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-listBg">
                                <div
                                    className="h-full rounded-full bg-textLightRed"
                                    style={{
                                        width: `${utilisationPercent(activeCard.used, activeCard.limit)}%`,
                                    }}
                                />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                <Text className="whitespace-nowrap text-xs text-textBody">
                                    Amount Spent: {formatRupees(activeCard.used)}
                                </Text>
                                <Text className="whitespace-nowrap text-xs text-textBody">
                                    Card Limit: {formatRupees(activeCard.limit)}
                                </Text>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button
                            type="primary"
                            className="!h-auto !min-h-8 font-medium !whitespace-normal"
                            disabled={!activeCard || isFrozen}
                            onClick={() => activeCard && onTopup?.(activeCard)}
                        >
                            Limit Increase
                        </Button>
                        <Button
                            danger
                            className="!h-auto !min-h-8 font-medium !whitespace-normal"
                            onClick={handleViewDetails}
                        >
                            View Details
                        </Button>
                    </div>
                </div>
            )}
        </SectionCard>
    );
};

export default MyCardsPanel;
