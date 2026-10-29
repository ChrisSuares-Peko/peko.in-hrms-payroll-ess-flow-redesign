import { useRef } from 'react';

import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import GoogleWorkspaceBuiltWithCloud from '../components/googleWorkspace/GoogleWorkspaceBuiltWithCloud';
import GoogleWorkspaceHero from '../components/googleWorkspace/GoogleWorkspaceHero';
import GoogleWorkspaceProductInfo from '../components/googleWorkspace/GoogleWorkspaceProductInfo';
import GoogleWorkspaceWhyChoose from '../components/googleWorkspace/GoogleWorkspaceWhyChoose';
import useHostingPlans from '../hooks/useHostingPlans';

const GoogleWorkspaceDetailPage = () => {
    const navigate = useNavigate();
    const plansRef = useRef<HTMLDivElement>(null);
    const { plans } = useHostingPlans('google_workspace');

    const handleBuyPlans = () => {
        navigate(
            `${paths.dashboard.domainHosting}/${paths.domainHosting.googleWorkspace}`
        );
    };

    return (
        <Content className="min-h-screen bg-white px-4 lg:px-6">
            <div className="mb-10">
                <GoogleWorkspaceHero plans={plans} onBuyPlans={handleBuyPlans} />
            </div>
            <GoogleWorkspaceWhyChoose />
            <GoogleWorkspaceBuiltWithCloud />
            <GoogleWorkspaceProductInfo plansRef={plansRef} />
        </Content>
    );
};

export default GoogleWorkspaceDetailPage;
