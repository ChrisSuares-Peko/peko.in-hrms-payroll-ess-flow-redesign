import { useEffect, useState } from 'react';

import { Empty } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import ConfirmFreezeModal, { FreezeCardReason } from './ConfirmFreezeModal';
import LimitIncreaseModal from './LimitIncreaseModal';
import MyCardCard from './MyCardCard';
import MyCardsHeader from './MyCardsHeader';
import MyCardSkeleton from './MyCardSkeleton';
import RequestNewCardModal from './RequestNewCardModal';
import RequestPhysicalCardModal from './RequestPhysicalCardModal';
import RequestUnfreezeModal from './RequestUnfreezeModal';
import { useCardsApi } from '../../../hooks/user/useCardsApi';
import { useCardStatusApi } from '../../../hooks/user/useCardStatusApi';
import { MyCard } from '../../../utils/types';
import PhysicalCardTrackingSection from '../../admin/PhysicalCardTrackingSection';
import { useDashboardNav } from '../../common/dashboardNav';

interface MyCardsTabProps {
    onCardTransactions?: (last4: string) => void;
}

/** Cardholder "My cards" tab: header + a responsive grid of the cardholder's card panels. */
const MyCardsTab = ({ onCardTransactions }: MyCardsTabProps) => {
    const dispatch = useAppDispatch();
    const navigate = useDashboardNav();
    const { cards: apiCards, isLoading, refetch } = useCardsApi();
    const { submitCardStatus, isLoading: freezing } = useCardStatusApi();
    const [cards, setCards] = useState<MyCard[]>([]);
    const [newCardOpen, setNewCardOpen] = useState(false);
    const [requestPhysicalCard, setRequestPhysicalCard] = useState<MyCard | null>(null);
    const [freezeCard, setFreezeCard] = useState<MyCard | null>(null);
    const [limitCard, setLimitCard] = useState<MyCard | null>(null);
    const [unfreezeRequestCard, setUnfreezeRequestCard] = useState<MyCard | null>(null);

    useEffect(() => {
        setCards(apiCards);
    }, [apiCards]);

    const handleFreeze = async (card: MyCard, { reason, reasonNote }: FreezeCardReason) => {
        const res = await submitCardStatus(card.key, 'FROZEN', reason, reasonNote);
        if (res) {
            await refetch();
            dispatch(
                showToast({
                    variant: 'success',
                    description: `Card ••${card.last4} frozen successfully`,
                })
            );
        }
        setFreezeCard(null);
    };

    const handleUnfreeze = (card: MyCard) => {
        if (card.terminationStatus) return;
        setUnfreezeRequestCard(card);
    };

    const handleViewDetails = (card: MyCard) => {
        if (card.cardViewLink) window.open(card.cardViewLink, '_blank', 'noopener,noreferrer');
    };

    const renderCards = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <MyCardSkeleton key={i} />
                    ))}
                </div>
            );
        }
        if (cards.length === 0) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <Empty description="No cards yet. Request a card to get started." />
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {cards.map(card => (
                    <MyCardCard
                        key={card.key}
                        card={card}
                        onViewDetails={handleViewDetails}
                        onFreeze={setFreezeCard}
                        onUnfreeze={handleUnfreeze}
                        onLimitIncrease={setLimitCard}
                        onTransactions={c => {
                            onCardTransactions?.(c.last4);
                            navigate('transactions');
                        }}
                        onCardControls={handleViewDetails}
                        onRequestPhysical={setRequestPhysicalCard}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="-mt-3 flex flex-col gap-6">
            <MyCardsHeader onRequestCard={() => setNewCardOpen(true)} />

            {renderCards()}

            <PhysicalCardTrackingSection
                showMember={false}
                emptyText="No physical cards ordered yet. Request one from a card above and its delivery will appear here."
            />

            <ConfirmFreezeModal
                card={freezeCard}
                onClose={() => setFreezeCard(null)}
                onConfirm={handleFreeze}
                isLoading={freezing}
            />

            <LimitIncreaseModal
                card={limitCard}
                onClose={() => setLimitCard(null)}
                onSuccess={refetch}
            />

            <RequestPhysicalCardModal
                open={requestPhysicalCard !== null}
                card={requestPhysicalCard}
                onClose={() => setRequestPhysicalCard(null)}
                onSuccess={refetch}
            />

            <RequestUnfreezeModal
                card={unfreezeRequestCard}
                onClose={() => setUnfreezeRequestCard(null)}
                onSuccess={refetch}
            />

            <RequestNewCardModal
                open={newCardOpen}
                onClose={() => setNewCardOpen(false)}
                onSuccess={refetch}
            />
        </div>
    );
};

export default MyCardsTab;
