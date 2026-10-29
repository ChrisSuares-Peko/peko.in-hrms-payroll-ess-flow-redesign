import { useEffect, useRef } from 'react';

import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';

import GoogleWorkspaceHero from '../components/googleWorkspace/GoogleWorkspaceHero';
import GoogleWorkspacePlans from '../components/googleWorkspace/GoogleWorkspacePlans';
import useHostingPlans from '../hooks/useHostingPlans';
import useServiceCart from '../hooks/useServiceCart';

const GoogleWorkspacePage = () => {
    const navigate = useNavigate();
    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('google_workspace_viewed', {});
        }
    }, []);

    const { plans, isLoading } = useHostingPlans('google_workspace');
    const { handleAddToCart, cartConflictModalProps } = useServiceCart();
    const plansRef = useRef<HTMLDivElement>(null);

    const onPurchase = async (
        productId: string,
        planId: string,
        planName: string,
        billingCycle: number
    ) => {
        if (typeof Moengage?.track_event === 'function') {
            const plan = plans.find(p => p.planId === planId);
            const price = plan?.pricingDetails?.add?.[String(billingCycle)] ?? plan?.price ?? 0;
            Moengage.track_event('google_workspace_plan_selected', {
                plan_name: planName,
                tenure: billingCycle,
                price,
                total_price: price * billingCycle,
                seats: 1,
            });
        }
        const result = await handleAddToCart({
            itemType: 'google_workspace',
            productId,
            planId,
            productName: planName,
            seats: 1,
            billingCycle,
        });
        if (result) navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.cart}`);
    };

    const handleLearnMore = () => {
        navigate(
            `${paths.dashboard.domainHosting}/${paths.domainHosting.googleWorkspaceDetail}`
        );
    };

    return (
        <Content className="min-h-screen bg-white px-4 lg:px-6">
            <GoogleWorkspaceHero plans={plans} onLearnMore={handleLearnMore} />
            <GoogleWorkspacePlans
                plansRef={plansRef}
                plans={plans}
                isLoading={isLoading}
                onPurchase={onPurchase}
            />
            <ConfirmationModal {...cartConflictModalProps} />
        </Content>
    );
};

export default GoogleWorkspacePage;
