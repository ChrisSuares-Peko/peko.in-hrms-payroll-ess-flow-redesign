import { Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import LandingPage from './LandingPage';
import EcommerceLanding from '../components/EcommerceLanding';
import RenewalOverlay from '../components/RenewalOverlay';
import useIsPurchased from '../hooks/useIsPurchased';

const HomePage = () => {
    const { data, isLoading, refetch } = useIsPurchased();
    const navigate = useNavigate();

    if (isLoading) {
        return <Skeleton active />;
    }

    const hasRenewalFailure =
        !data.isPurchased && data.previousSubscription?.status === 'EXPIRED';

    if (!data.isPurchased && !hasRenewalFailure) {
        return (
            <EcommerceLanding
                onSubscribe={() => navigate(`${paths.dashboard.ecommerce}/${paths.ecommerce.plan}`)}
            />
        );
    }

    return (
        <RenewalOverlay
            subscriptionDetails={{
                isPurchased: data.isPurchased,
                previousSubscription: data.previousSubscription,
            }}
        >
            <LandingPage subscriptionData={data} onSubscriptionChange={refetch} />
        </RenewalOverlay>
    );
};

export default HomePage;
