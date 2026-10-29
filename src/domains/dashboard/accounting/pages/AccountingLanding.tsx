import { useEffect, useMemo, useState } from 'react';

import { Flex } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';

import { getTransactions } from '../api/transactions';
import FeatureCardGrid from '../sections/FeatureCardGrid';
import GetStartedBanner from '../sections/GetStartedBanner';
import GreetingHeader from '../sections/GreetingHeader';
import UploadStatementModal from '../sections/upload/UploadStatementModal';
import { featureCards } from '../utils/data';

const UPLOAD_CARD_KEY = 'upload-bank-statement';

const AccountingLanding = () => {
    const navigate = useNavigate();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const [txnCount, setTxnCount] = useState<number | null>(null);

    useEffect(() => {
        let active = true;
        getTransactions({ userId, userType, tab: 'all', itemsPerPage: 1 }).then(data => {
            if (active && data) setTxnCount(data.counts.all);
        });
        return () => {
            active = false;
        };
    }, [userId, userType]);

    const statusByKey = useMemo(() => {
        const map: Record<string, string> = {};
        if (txnCount) {
            map.transactions = `${txnCount} transaction${txnCount === 1 ? '' : 's'}`;
            map['financial-statements'] = 'Ready to view';
            map.insights = 'Ready to view';
        }
        return map;
    }, [txnCount]);

    const openUpload = () => setIsUploadOpen(true);

    const handleCardAction = (key: string) => {
        if (key === UPLOAD_CARD_KEY) {
            openUpload();
            return;
        }
        const target = featureCards.find(card => card.key === key)?.path;
        if (target) navigate(target);
    };

    return (
        <Flex vertical gap={12} className="px-2 py-4">
            <GreetingHeader />
            <GetStartedBanner onUpload={openUpload} />
            <FeatureCardGrid onCardAction={handleCardAction} statusByKey={statusByKey} />
            <UploadStatementModal open={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
        </Flex>
    );
};

export default AccountingLanding;
