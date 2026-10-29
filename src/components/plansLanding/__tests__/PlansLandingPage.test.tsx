import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
    ComparisonColumn,
    ComparisonFeature,
    IndividualServiceView,
    PlanCardVM,
} from '@utils/plansLandingData';

import PlansLandingPage from '../PlansLandingPage';

const planCards: PlanCardVM[] = [
    {
        id: 1,
        name: 'Free',
        tagline: 'Get started',
        priceLabel: 'Free',
        billingNote: 'No card required',
        annualPriceLabel: 'Free',
        annualBillingNote: 'No card required',
        actionType: 'CURRENT',
    } as PlanCardVM,
    {
        id: 2,
        name: 'Peko Go',
        tagline: 'For growing teams',
        priceLabel: '₹499',
        pricePeriod: '/Month',
        billingNote: 'Billed monthly',
        annualPriceLabel: '₹4,999',
        annualPricePeriod: '/Year',
        annualBillingNote: 'Billed annually',
        actionType: 'UPGRADE',
        isRecommended: true,
    } as PlanCardVM,
    {
        id: 3,
        name: 'Peko Plus',
        tagline: 'Everything included',
        priceLabel: '₹1,499',
        pricePeriod: '/Month',
        billingNote: 'Billed monthly',
        annualPriceLabel: '₹14,999',
        annualPricePeriod: '/Year',
        annualBillingNote: 'Billed annually',
        actionType: 'UPGRADE',
        isBestValue: true,
    } as PlanCardVM,
];

const individualServices: IndividualServiceView[] = [
    {
        id: 11,
        name: 'Payroll',
        description: 'Run payroll in minutes',
        priceLabel: '₹299',
        pricePeriod: '/Month',
    } as IndividualServiceView,
    {
        id: 12,
        name: 'eSign',
        description: 'Sign documents online',
        priceLabel: '₹199',
        pricePeriod: '/Month',
    } as IndividualServiceView,
];

const columns: ComparisonColumn[] = [
    { name: 'Free', price: 'Free' },
    { name: 'Peko Go', price: '₹499/mo' },
];

const rows: ComparisonFeature[] = [
    { label: 'Invoicing', cells: [{ kind: 'check' }, { kind: 'check' }] },
    { label: 'Payroll', cells: [{ kind: 'none' }, { kind: 'check' }] },
] as ComparisonFeature[];

const renderPage = (overrides: Partial<React.ComponentProps<typeof PlansLandingPage>> = {}) =>
    render(
        <PlansLandingPage
            planCards={planCards}
            comparison={{ columns, rows }}
            individualServices={individualServices}
            isResolvingPlans={false}
            annualDiscountPercent={20}
            onChoosePlan={vi.fn()}
            onSubscribeIndividual={vi.fn()}
            {...overrides}
        />
    );

describe('PlansLandingPage', () => {
    // vitest.setup.ts stubs IntersectionObserver with an inert observe(), so useInView never
    // flips here. Entrance animations must therefore never gate visibility.
    it('renders every main plan card even when the intersection observer never reports', () => {
        renderPage();

        // Taglines are unique to the plan cards; the plan names also appear in the
        // comparison table's column headers.
        expect(screen.getByText('Get started')).toBeInTheDocument();
        expect(screen.getByText('For growing teams')).toBeInTheDocument();
        expect(screen.getByText('Everything included')).toBeInTheDocument();
        expect(screen.getByText('Peko Plus')).toBeInTheDocument();
    });

    it('renders the individual service cards even when the observer never reports', () => {
        renderPage();

        expect(screen.getByText('eSign')).toBeInTheDocument();
        expect(screen.getByText('Run payroll in minutes')).toBeInTheDocument();
        expect(screen.getByText('Sign documents online')).toBeInTheDocument();
    });

    it('never leaves entrance-animated content stranded at opacity 0', () => {
        const { container } = renderPage();

        expect(container.querySelectorAll('.opacity-0')).toHaveLength(0);
    });

    it('shows the compare-plans jump link and the anchor it targets', () => {
        const { container } = renderPage();

        expect(screen.getByText('Compare Plans')).toBeInTheDocument();
        expect(container.querySelector('#feature-comparison-table')).not.toBeNull();
    });

    it('hides the compare-plans link when there is no comparison data', () => {
        renderPage({ comparison: { columns: [], rows: [] } });

        expect(screen.queryByText('Compare Plans')).not.toBeInTheDocument();
    });

    it('renders nothing for individual services when none are available', () => {
        renderPage({ individualServices: [] });

        expect(screen.queryByText('or just need one?')).not.toBeInTheDocument();
    });
});
