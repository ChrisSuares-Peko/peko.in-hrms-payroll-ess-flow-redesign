import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import TitanEmailEnterprisePlan from '../components/titanEmail/TitanEmailEnterprisePlan';
import TitanEmailHero from '../components/titanEmail/TitanEmailHero';
import TitanEmailPowerfulTools from '../components/titanEmail/TitanEmailPowerfulTools';
import TitanEmailProductInfo from '../components/titanEmail/TitanEmailProductInfo';
import TitanEmailWhatYouGet from '../components/titanEmail/TitanEmailWhatYouGet';
import useHostingPlans from '../hooks/useHostingPlans';

const TitanEmailDetailPage = () => {
    const navigate = useNavigate();
    const { plans } = useHostingPlans('titan_email');

    const handleBuyPlans = () => {
        navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.titanEmail}`);
    };

    return (
        <Content className="min-h-screen bg-white px-4 py-6 lg:px-6">
            <TitanEmailHero plans={plans} onBuyPlans={handleBuyPlans} />
            <TitanEmailWhatYouGet />
            <TitanEmailPowerfulTools />
            <TitanEmailEnterprisePlan />
            <TitanEmailProductInfo onBuyNow={handleBuyPlans} />
        </Content>
    );
};

export default TitanEmailDetailPage;
