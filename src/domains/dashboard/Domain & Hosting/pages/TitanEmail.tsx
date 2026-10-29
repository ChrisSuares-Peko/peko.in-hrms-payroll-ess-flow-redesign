import { useEffect, useRef } from 'react';

import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';

import TitanEmailHero from '../components/titanEmail/TitanEmailHero';
import TitanEmailPlans from '../components/titanEmail/TitanEmailPlans';
import useHostingPlans from '../hooks/useHostingPlans';
import useServiceCart from '../hooks/useServiceCart';

const TitanEmailPage = () => {
    const navigate = useNavigate();
    const plansRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('titan_email_viewed', {});
        }
    }, []);

    const { plans, isLoading } = useHostingPlans('titan_email');
    const { handleAddToCart, cartConflictModalProps } = useServiceCart();

    const onAddToCart = async (productId: string, planId: string, planName: string) => {
        if (typeof Moengage?.track_event === 'function') {
            const plan = plans.find(p => p.planId === planId);
            const price = plan?.pricingDetails?.add?.['1'] ?? plan?.price ?? 0;
            Moengage.track_event('titan_plan_selected', {
                plan_name: planName,
                tenure: 1,
                price,
                total_price: price,
            });
        }
        const result = await handleAddToCart({
            itemType: 'titan_email',
            productId,
            planId,
            productName: planName,
            accounts: 1,
            billingCycle: 1,
        });
        if (result) navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.cart}`);
    };

    const handleLearnMore = () => {
        navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.titanEmailDetail}`);
    };

    return (
        <Content className="min-h-screen bg-white px-4 py-6 lg:px-6">
            <TitanEmailHero plans={plans} onLearnMore={handleLearnMore} />
            <TitanEmailPlans plansRef={plansRef} plans={plans} isLoading={isLoading} onAddToCart={onAddToCart} />
            <ConfirmationModal {...cartConflictModalProps} />
        </Content>
    );
};

export default TitanEmailPage;
