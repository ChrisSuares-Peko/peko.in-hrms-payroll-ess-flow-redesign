import { Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import PosDashboard from './PosDashboard';
import PekoPosLanding from '../components/PekoPosLanding';
import useIsPurchased from '../hooks/useIsPurchased';

const HomePage = () => {
    const { data, isLoading } = useIsPurchased();
    const navigate = useNavigate();

    if (isLoading) return <Skeleton active />;

    if (!data.isPurchased) {
        return (
            <PekoPosLanding
                onGetStarted={() => navigate(`${paths.dashboard.pekoPos}/${paths.pekoPos.plan}`)}
            />
        );
    }

    return <PosDashboard />;
};

export default HomePage;
