import { Skeleton, Typography } from 'antd';

import useIsPurchased from '../hooks/useIsPurchased';

const BillingHistoryPage = () => {
    const { isLoading } = useIsPurchased();

    if (isLoading) {
        return <Skeleton active />;
    }

    return <Typography.Text className="text-xl font-medium">Billing History</Typography.Text>;
};

export default BillingHistoryPage;
