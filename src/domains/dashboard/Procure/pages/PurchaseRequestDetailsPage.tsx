import React from 'react';

import { Skeleton } from 'antd';
import { useParams } from 'react-router-dom';

import PurchaseRequestDrawer from '../components/PurchaseRequest/PurchaseRequestDrawer';
import { usePurchaseRequestApi } from '../hooks/usePurchaseRequestApi';

const PurchaseRequestDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { isLoading, detail, fetchDetail } = usePurchaseRequestApi(id);

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (!detail) return null;

    return <PurchaseRequestDrawer record={detail} onRefresh={fetchDetail} />;
};

export default PurchaseRequestDetailsPage;
