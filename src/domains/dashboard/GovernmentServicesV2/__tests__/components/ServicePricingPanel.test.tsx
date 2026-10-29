import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VendorServiceDetail } from '../../apis';
import ServicePricingPanel from '../../components/ServicePricingPanel';

const onSelectVariant = vi.fn();
const onContinue = vi.fn();

const makeVariant = (overrides: Partial<VendorServiceDetail>): VendorServiceDetail => ({
    id: 1,
    bid: 0,
    partner_bid: 0,
    service_id: 10,
    category: '',
    sub_category: '',
    type: 0,
    government_department: '',
    partner_name: '',
    service_name: 'Trademark Registration',
    variant_name: 'Basic',
    description: '',
    rating: '',
    customers: 0,
    market_price: 0,
    price: 1499,
    price_type: 0,
    government_fee_amount: 0,
    payment_type: '',
    delivery_time: 0,
    about: '',
    page_url: '',
    unit: '',
    currency: 'INR',
    status: true,
    imageURL: '',
    entity: '',
    priceType: '',
    country: '',
    Engagement_Subscription_Status: '',
    ...overrides,
});

const basic = makeVariant({ id: 1, variant_name: 'Basic', price: 1499 });
const premium = makeVariant({
    id: 2,
    variant_name: 'Premium',
    price: 4999,
    description: 'Premium plan description',
    about: '* Filing\n- Search report\r\nFiling\n\n  ',
});

const renderPanel = (props: Partial<Parameters<typeof ServicePricingPanel>[0]> = {}) =>
    render(
        <ServicePricingPanel
            variants={[basic, premium]}
            selectedVariantId={1}
            onSelectVariant={onSelectVariant}
            selectedVariant={basic}
            isPricingLoading={false}
            pekoFee={1499}
            govFee={0}
            totalAmount={1499}
            isApplying={false}
            isProceeding={false}
            onContinue={onContinue}
            {...props}
        />
    );

const continueButton = () => screen.getByRole('button', { name: /Continue/ });

describe('ServicePricingPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the heading and variant cards with formatted prices', () => {
        renderPanel();

        expect(screen.getByText('Confirm the plan and pricing before you proceed to pay')).toBeInTheDocument();
        expect(screen.getByText('Basic')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('₹ 4,999.00')).toBeInTheDocument();
    });

    it('highlights only the selected variant', () => {
        renderPanel({ selectedVariantId: 2, selectedVariant: premium });

        const [basicCard, premiumCard] = screen
            .getAllByRole('button')
            .filter((el) => el.tagName === 'DIV');
        expect(premiumCard).toHaveStyle({ border: '1px solid #FF3A3A' });
        expect(basicCard).toHaveStyle({ border: '1px solid #e4e7ec' });
    });

    it('calls onSelectVariant on click and on Enter key', () => {
        renderPanel();

        fireEvent.click(screen.getByText('Premium'));
        expect(onSelectVariant).toHaveBeenCalledWith(2);

        const basicCard = screen.getByText('Basic').closest('[role="button"]') as Element;
        fireEvent.keyDown(basicCard, { key: 'Enter' });
        expect(onSelectVariant).toHaveBeenCalledWith(1);

        onSelectVariant.mockClear();
        fireEvent.keyDown(basicCard, { key: 'a' });
        expect(onSelectVariant).not.toHaveBeenCalled();
    });

    it('renders no variant cards when the list is empty', () => {
        renderPanel({ variants: [], selectedVariantId: null, selectedVariant: null });

        expect(screen.queryByText('Basic')).not.toBeInTheDocument();
        expect(screen.getByText('Payment Breakdown')).toBeInTheDocument();
    });

    it('shows description and de-duplicated "What\'s included" lines for the selected variant', () => {
        renderPanel({ selectedVariantId: 2, selectedVariant: premium });

        expect(screen.getByText('Premium plan description')).toBeInTheDocument();
        expect(screen.getByText("What's included")).toBeInTheDocument();
        // "* Filing" and "Filing" collapse into one line; bullet markers stripped
        expect(screen.getAllByText('Filing')).toHaveLength(1);
        expect(screen.getByText('Search report')).toBeInTheDocument();
    });

    it('omits description and included section when the variant has none', () => {
        renderPanel();

        expect(screen.queryByText("What's included")).not.toBeInTheDocument();
    });

    it('renders the payment breakdown without the government fee when it is zero', () => {
        renderPanel({ pekoFee: 1499, govFee: 0, totalAmount: 1499 });

        expect(screen.getByText('Payment Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Price')).toBeInTheDocument();
        expect(screen.queryByText('Government Fee')).not.toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('renders the government fee and total when govFee > 0', () => {
        renderPanel({ pekoFee: 1000, govFee: 4500, totalAmount: 5500 });

        expect(screen.getByText('Government Fee')).toBeInTheDocument();
        expect(screen.getByText('₹ 4,500.00')).toBeInTheDocument();
        expect(screen.getByText('₹ 1,000.00')).toBeInTheDocument();
        expect(screen.getByText('₹ 5,500.00').closest('.ant-typography')).toHaveStyle({ color: '#FF3A3A' });
    });

    it('shows a skeleton and disables Continue while pricing loads', () => {
        const { container } = renderPanel({ isPricingLoading: true });

        expect(container.querySelector('.ant-skeleton')).not.toBeNull();
        expect(screen.queryByText('Payment Breakdown')).not.toBeInTheDocument();
        expect(continueButton()).toBeDisabled();
    });

    it('calls onContinue when Continue is clicked', () => {
        renderPanel();

        expect(continueButton()).toBeEnabled();
        fireEvent.click(continueButton());

        expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['isApplying', { isApplying: true }],
        ['isProceeding', { isProceeding: true }],
    ])('shows Continue in a loading state when %s', (_, props) => {
        renderPanel(props);

        expect(continueButton()).toHaveClass('ant-btn-loading');
    });
});
