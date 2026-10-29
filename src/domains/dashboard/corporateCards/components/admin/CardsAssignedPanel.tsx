import { useState } from 'react';

import { Skeleton, Typography } from 'antd';

import AuditTrailModal from './AuditTrailModal';
import ManageCardModal from './ManageCardModal';
import RequestPhysicalCardModal from './RequestPhysicalCardModal';
import auditTrailIcon from '../../assets/icons/auditTrail.svg';
import manageIcon from '../../assets/icons/manageCard.svg';
import noCardIcon from '../../assets/icons/noCard.svg';
import {
    displayCardStatus,
    formatRupees,
    formatRupeesDecimal,
    utilisationPercent,
} from '../../utils/helpers';
import { CardData, CardRecord } from '../../utils/types';
import CardCarousel from '../common/CardCarousel';
import { useDashboardNav } from '../common/dashboardNav';
import SectionCard, { ViewAllLink } from '../common/SectionCard';
import StatusTag from '../common/StatusTag';

const { Text } = Typography;

interface CardsAssignedPanelProps {
    cards: CardData[];
    cardRecords: CardRecord[];
    activeCount: number;
    frozenCount?: number;
    onManageSuccess?: () => void;
    /** Cards are still loading — show a placeholder instead of the "no cards" empty state. */
    loading?: boolean;
}

const ACTIONS = [
    { key: 'manage', label: 'Manage', icon: manageIcon },
    { key: 'audit', label: 'Audit Trail', icon: auditTrailIcon },
];

const badgeText = (activeCount: number, frozenCount: number) =>
    `( ${activeCount} Active + ${frozenCount} Frozen )`;

/** Admin "Cards Assigned" panel — card carousel, balance remaining, utilisation and quick actions. */
const CardsAssignedPanel = ({
    cards,
    cardRecords,
    activeCount,
    frozenCount = 0,
    onManageSuccess,
    loading,
}: CardsAssignedPanelProps) => {
    const navigate = useDashboardNav();
    const [activeIndex, setActiveIndex] = useState(0);
    const [auditCard, setAuditCard] = useState<CardData | null>(null);
    const [manageCard, setManageCard] = useState<CardRecord | null>(null);
    const [requestCard, setRequestCard] = useState<CardRecord | null>(null);

    const activeCard = cards[activeIndex] ?? cards[0];
    const balanceRemaining = activeCard ? Math.max(activeCard.limit - activeCard.used, 0) : 0;

    const getActionHandler = (key: string) => {
        if (key === 'audit' && activeCard) return () => setAuditCard(activeCard);
        if (key === 'manage' && activeCard) {
            const record = cardRecords.find(c => c.key === activeCard.key);
            return () => setManageCard(record ?? null);
        }
        return undefined;
    };

    if (loading) {
        return (
            <SectionCard
                title="Cards Assigned"
                badge={badgeText(activeCount, frozenCount)}
                action={<ViewAllLink label="View all" onClick={() => navigate('cards')} />}
            >
                <Skeleton active paragraph={{ rows: 8 }} />
            </SectionCard>
        );
    }

    return (
        <SectionCard
            title="Cards Assigned"
            badge={badgeText(activeCount, frozenCount)}
            action={<ViewAllLink label="View all" onClick={() => navigate('cards')} />}
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
                <div className="flex flex-col gap-6">
                    <CardCarousel cards={cards} onActiveIndexChange={setActiveIndex} />

                    {activeCard && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col items-center gap-2">
                                {activeCard.status && activeCard.status !== 'Active' && (
                                    <StatusTag
                                        status={displayCardStatus(
                                            activeCard.status,
                                            activeCard.terminationStatus
                                        )}
                                    />
                                )}
                                <Text className="text-sm text-textBody">Balance Remaining</Text>
                                <Text className="text-2xl font-semibold text-textHeadings xl:text-3xl">
                                    {formatRupees(balanceRemaining)}
                                </Text>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-listBg">
                                    <div
                                        className="h-full rounded-full bg-textLightRed"
                                        style={{
                                            width: `${utilisationPercent(activeCard.used, activeCard.limit)}%`,
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-textBody">
                                    <span>
                                        Amount Spent: {formatRupeesDecimal(activeCard.used)}
                                    </span>
                                    <span>Card Limit: {formatRupeesDecimal(activeCard.limit)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        {ACTIONS.map(({ key, label, icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={getActionHandler(key)}
                                className="flex items-center justify-center gap-2 rounded-lg border border-textLightRed bg-white px-3 py-2.5 text-sm font-medium text-textLightRed transition-colors hover:bg-bgLightGray"
                            >
                                <img
                                    src={icon}
                                    alt=""
                                    className="hidden h-5 w-5 shrink-0 sm:flex"
                                />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>

                    <AuditTrailModal
                        open={auditCard !== null}
                        onClose={() => setAuditCard(null)}
                        last4={auditCard?.last4 ?? ''}
                        cardIssuanceId={auditCard?.key}
                    />
                    <ManageCardModal
                        card={manageCard}
                        onClose={() => setManageCard(null)}
                        onRequestPhysical={() => setRequestCard(manageCard)}
                        onSuccess={onManageSuccess}
                    />
                    <RequestPhysicalCardModal
                        open={requestCard !== null}
                        onClose={() => setRequestCard(null)}
                        holderName={(requestCard?.nameOnCard || requestCard?.holder) ?? ''}
                        cardIssuanceId={requestCard?.key ?? ''}
                        last4={requestCard?.last4 ?? ''}
                        cardLimit={requestCard?.cardLimit ?? 0}
                    />
                </div>
            )}
        </SectionCard>
    );
};

export default CardsAssignedPanel;
