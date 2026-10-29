import React, { useEffect, useMemo } from 'react';

import { Content } from 'antd/es/layout/layout';
import { Navigate, useNavigate } from 'react-router-dom';

import { PlansLandingPage } from '@components/plansLanding';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import {
    individualServiceIcons,
    individualServiceIconsByName,
    type BillingCycle,
    type IndividualServiceView,
    type PlanCardVM,
} from '@utils/plansLandingData';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useGetPackages from '../hooks/useGetPackages';
import { PlanType, type IndividualPlan } from '../types';
import {
    buildComparisonData,
    buildPlanCards,
    calculateMaxDiscountPercentages,
    PLAN_DETAILS_SESSION_KEY,
    trackSubscribeClicked,
} from '../utils';

// Maps the GROUP plan's display name (packageName) to its per-plan "_viewed" Moengage event,
// fired when the user clicks "Choose This Plan". Only Peko Go / Peko+ are tracked per spec;
// packageName is "Peko+" (no space), so a generic slugify (.replace(/\s+/g, '_')) would not
// produce "peko_plus" — hence the explicit map instead.
const PLAN_VIEWED_EVENT_MAP: Record<string, string> = {
    'Peko Go': 'peko_go_plan_viewed',
    'Peko+': 'peko_plus_plan_viewed',
};

const netMonthlyPrice = (plan: IndividualPlan) =>
    Number(plan.packagePrices?.monthly ?? 0) - Number(plan.discount?.monthly ?? 0);

const PlanLandingPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { data, isLoading, currentPlanDetails, whatsappPlans, individualPlans } =
        useGetPackages();
    const { roleName } = useAppSelector(state => state.reducer.auth);

    // Everything on the page is built from the live list-packages response.
    const planCards = useMemo(
        () => buildPlanCards(data, currentPlanDetails),
        [data, currentPlanDetails]
    );
    const comparison = useMemo(
        () => buildComparisonData(data, whatsappPlans),
        [data, whatsappPlans]
    );
    // "Up to X% off" for the Annual toggle — the max annual discount across plans, from live prices.
    const annualDiscountPercent = useMemo(
        () => Number(calculateMaxDiscountPercentages(data).annually) || 0,
        [data]
    );

    // The à-la-carte ("or just need one?") section is only for free-plan users — paid group plans
    // already bundle these services. Cards come from the real top-level individualPlans array
    // (already filtered to listable single-service plans, ordered by priorityLevel on the backend).
    const individualServices = useMemo<IndividualServiceView[]>(
        () =>
            individualPlans
                .filter(plan => netMonthlyPrice(plan) > 0)
                .map(plan => {
                    const net = netMonthlyPrice(plan);
                    // Descriptions are multi-line feature lists — use the first meaningful line as the tagline.
                    const tagline =
                        (plan.description || '')
                            .split('\n')
                            .map(line => line.replace(/^#+\s*/, '').trim())
                            .find(Boolean) || '';
                    return {
                        id: plan.id,
                        name: plan.packageName,
                        description: tagline,
                        priceLabel: `₹${formatNumberWithLocalString(net, 0)}`,
                        pricePeriod: '/Month + GST',
                        iconKey:
                            individualServiceIcons[plan.accessCode] ??
                            individualServiceIconsByName[plan.packageName],
                        logo: plan.packageLogo || undefined,
                        isOwned: Boolean(plan.isOwned),
                    };
                }),
        [individualPlans]
    );

    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('service_viewed', {
                service_name: 'peko_plan',
            });
        }
    }, []);

    if (roleName && roleName === 'corporate sub user') {
        return <Navigate to="/404" replace />;
    }

    const startSubscription = (
        planId: number,
        service?: string,
        billing: BillingCycle = 'monthly'
    ) => {
        sessionStorage.setItem(
            PLAN_DETAILS_SESSION_KEY,
            JSON.stringify({
                planId,
                ...(service ? { service } : {}),
                selectedType: billing === 'annually' ? PlanType.Annually : PlanType.Monthly,
                isAddOns: false,
                url: window.location.href,
            })
        );
        navigate(paths.plans.reviewOrder);
    };

    const currentPlanCard = planCards.find(c => c.actionType === 'CURRENT');

    // Downgrade targets (e.g. Free while on Peko+) stay clickable — clicking explains why the
    // switch isn't self-serve instead of looking like a dead button.
    const handleChoosePlan = (card: PlanCardVM, billing: BillingCycle) => {
        if (card.actionType === 'DOWNGRADE') {
            dispatch(
                showToast({
                    variant: 'info',
                    description: `You're currently on ${currentPlanCard?.name ?? 'a paid plan'}. To move to the ${card.name} plan, cancel your current subscription from Settings → Subscription Plans. Your paid benefits remain active until the end of the billing period.`,
                })
            );
            return;
        }
        const viewedEvent = PLAN_VIEWED_EVENT_MAP[card.name];
        if (viewedEvent && typeof Moengage?.track_event === 'function') {
            Moengage.track_event(viewedEvent);
        }
        startSubscription(card.id, undefined, billing);
    };

    // À-la-carte plans are free-plan-only: paid GROUP plans (Go/Peko+) already bundle these services.
    // The card stays visible + clickable; clicking just explains why it's unavailable. Owned plans
    // likewise toast instead of re-purchasing. The backend create-order enforces both as the real
    // safeguard.
    const handleSubscribeIndividual = (service: IndividualServiceView) => {
        const currentPackage = data.find(p => p.id === currentPlanDetails.currentPackageId);
        const isFreeUser = currentPackage
            ? parseFloat(currentPackage.packagePrices.monthly) === 0
            : true;
        if (!isFreeUser) {
            dispatch(
                showToast({
                    variant: 'info',
                    description: `You're already on ${currentPlanCard?.name ?? 'your current plan'}, which includes ${service.name}. To subscribe to ${service.name} individually, cancel your existing plan first.`,
                })
            );
            return;
        }
        trackSubscribeClicked(service.name);
        startSubscription(service.id, service.name);
    };

    return (
        <Content>
            <PlansLandingPage
                planCards={planCards}
                comparison={comparison}
                individualServices={individualServices}
                isResolvingPlans={isLoading}
                annualDiscountPercent={annualDiscountPercent}
                onChoosePlan={handleChoosePlan}
                onSubscribeIndividual={handleSubscribeIndividual}
            />
        </Content>
    );
};

export default PlanLandingPage;
