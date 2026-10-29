import React from 'react';

import { Col, Flex, Row, Skeleton } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import RenewalOverlay from '@components/molecular/subscription/RenewalOverlay';
import useEnableProductTour from '@domains/dashboard/Home/hooks/useEnableProductTour';
import ServiceNotPurchasedPage from '@domains/dashboard/IndividualPlan/pages/ServiceNotPurchased';
import { PLAN_DETAILS_SESSION_KEY } from '@domains/dashboard/plans/utils';
import ServiceUnavailable from '@src/domains/failed/pages/ServiceUnavailable';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import AdaptiveCommonLandingPage from './AdaptiveCommonLandingPage';
import NewIndividualLandingPage from './NewIndividualLandingPage';
import FeatureCard from '../components/FeatureCard';
import FeatureCardMob from '../components/FeatureCardMob';
// import UpgradeToIndividualCTA from '../components/UpgradeToIndividualCTA';
import { useGetDetailsSubscription } from '../hooks/useGetDetailsSubscription';

// Define the prop types for the component
type SubscriptionPageProps = {
    accessCode: string;
    serviceAccessKey: string;
    serviceName: string;
    title: string;
    serviceDetails: string;
    subDescription: string;
    features: {
        icon: string;
        iconMob: string;
        title: string;
        description: string;
        link?: string;
    }[];
    invoiceCommissionData?: {
        isPercentage: boolean;
        charge: string;
        fixedSurcharge: number;
        uaeCardsCharge: number;
        internationalCardsCharge: number;
    };
    children: React.ReactNode;
};

const SubscriptionPage = ({
    accessCode,
    serviceAccessKey,
    invoiceCommissionData,
    serviceName,
    title,
    serviceDetails,
    subDescription,
    features,
    children,
}: SubscriptionPageProps) => {
    const { xs } = useScreenSize();
    const { user } = useAppSelector(state => state.reducer.user);
    const navigate = useNavigate();

    const {
        isLoading: subscriptionLoading,
        subscriptionData,
        dismissSubscriptionLanding,
    } = useGetDetailsSubscription(accessCode, serviceAccessKey);
    const { handleUpdateTour } = useEnableProductTour();

    if (subscriptionLoading) {
        return <Skeleton />;
    }

    if (!subscriptionData) {
        return <ServiceUnavailable />;
    }

    const { isPurchased, previousSubscription } = subscriptionData;

    if (!isPurchased && user?.roleName === 'corporate sub user') {
        return <ServiceNotPurchasedPage />;
    }

    // Upgrade-to-individual CTA temporarily disabled (not required for now).
    // Offer the individual package only to basic/free users (no paid GROUP plan) who currently have the
    // service (via Peko Free bundling) but don't already own this service's individual package. Paid
    // GROUP (Peko Go/Plus) users and existing individual owners don't see it. First-time basic users
    // (isPurchased=false, no previous) already get the full purchase UI via NewIndividualLandingPage.
    // const showUpgradeCTA =
    //     isPurchased &&
    //     !isPaidGroupUser &&
    //     !ownsIndividualPackage &&
    //     user?.roleName !== 'corporate sub user' &&
    //     subscriptionData.packageDetails.length > 0;

    // Post-purchase, one-time tour: backend flagged this service's landing as unseen for
    // an already-subscribed corporate. Reuses the purchase landing pages in "tour mode"
    // (onContinue set) instead of the purchase CTA.
    const showFirstTimeLanding =
        isPurchased &&
        subscriptionData.showSubscriptionLanding === true &&
        !!subscriptionData.subscriptionLandingKey;

    const handleContinueFirstTimeLanding = () => {
        if (subscriptionData.subscriptionLandingKey) {
            handleUpdateTour(subscriptionData.subscriptionLandingKey);
        }
        dismissSubscriptionLanding();
    };

    // First-time visitor with no prior subscription — show purchase landing page
    const showPrePurchaseLanding = !isPurchased && !previousSubscription;

    if (showPrePurchaseLanding || showFirstTimeLanding) {
        if (showPrePurchaseLanding && subscriptionData.packageDetails.length === 0) {
            return <ServiceUnavailable />;
        }
        const onContinue = showFirstTimeLanding ? handleContinueFirstTimeLanding : undefined;
        return (
            xs !== undefined && (
                <Content style={{ maxWidth: '1500px', margin: '0 auto', padding: '0 20px' }}>
                    {xs ? (
                        <AdaptiveCommonLandingPage
                            serviceName={serviceName}
                            title={title}
                            serviceDetails={serviceDetails}
                            subDescription={subDescription}
                            packageDetails={subscriptionData.packageDetails[0]}
                            invoiceCommissionData={invoiceCommissionData}
                            onContinue={onContinue}
                        >
                            <Row gutter={[15, 15]}>
                                {features.map((feature, index) => (
                                    <Col xs={12} key={index}>
                                        <FeatureCardMob
                                            icon={feature.iconMob}
                                            title={feature.title}
                                            description={feature.description}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </AdaptiveCommonLandingPage>
                    ) : (
                        <NewIndividualLandingPage
                            serviceName={serviceName}
                            title={title}
                            serviceDetails={serviceDetails}
                            subDescription={subDescription}
                            invoiceCommissionData={invoiceCommissionData}
                            packageDetails={subscriptionData.packageDetails[0]}
                            onContinue={onContinue}
                        >
                            <Flex justify="center" align="center">
                                <div className="feature-cards-container">
                                    {features.map((feature, index) => (
                                        <div className="feature-card" key={index}>
                                            <FeatureCard icon={feature.icon} />
                                        </div>
                                    ))}
                                </div>
                            </Flex>
                        </NewIndividualLandingPage>
                    )}
                </Content>
            )
        );
    }

    // Active or expired subscription — show service with renewal overlay.
    // `paidPlanExpiredRecently` makes the banner appear even when Peko Free
    // currently grants access (isPurchased=true) but the user just lost Peko Go / Peko Plus.
    //
    // Payroll-specific frozen-state warning: when the user lands in FROZEN state on the
    // Payroll surface, surface the upcoming data-clear deadline inside the overlay so the
    // user is informed BEFORE the scheduler actually wipes their employees.
    const payrollFrozenMessage =
        serviceName === 'Payroll' && subscriptionData?.lifecycle?.state === 'FROZEN'
            ? `If you do not resubscribe, your Payroll data will be cleared after ${subscriptionData.lifecycle.payrollDataClearDays} days.`
            : undefined;

    return (
        <RenewalOverlay
            subscriptionDetails={subscriptionData}
            paidPlanExpiredRecently={subscriptionData.paidPlanExpiredRecently}
            handleUpgrade={() => {
                // Renewal of the expired plan → review-order pre-filled with it, not the plans list.
                if (previousSubscription?.packageId) {
                    sessionStorage.setItem(
                        PLAN_DETAILS_SESSION_KEY,
                        JSON.stringify({
                            url: window.location.href.split('?')[0],
                            service: previousSubscription.packageName,
                            planId: previousSubscription.packageId,
                            selectedType:
                                previousSubscription.billingType === 'ANNUALLY'
                                    ? 'annually'
                                    : 'monthly',
                            isAddOns: false,
                        })
                    );
                    navigate(`/${paths.plans.index}/${paths.plans.reviewOrder}`);
                    return;
                }
                navigate(paths.dashboard.plans);
            }}
            frozenExtraMessage={payrollFrozenMessage}
        >
            {/* Upgrade-to-individual CTA temporarily disabled (not required for now).
            {showUpgradeCTA && (
                <UpgradeToIndividualCTA
                    serviceName={serviceName}
                    packageDetails={subscriptionData.packageDetails[0]}
                />
            )} */}
            {children}
        </RenewalOverlay>
    );
};

export default SubscriptionPage;
