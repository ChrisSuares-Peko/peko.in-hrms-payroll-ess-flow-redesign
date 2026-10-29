import { render, fireEvent, cleanup } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlanCard from '../../components/PlanCard';

describe('PlanCard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
    });
    it('renders the plan name', () => {
        const { getByText } = render(
            <PlanCard
                planId={1}
                features={[]}
                planName="Basic Plan"
                image_url=""
                selectedType="Monthly"
                monthlyPrice={100}
                yearlyPrice={1000}
                descriptions={[]}
                handlePurchase={() => {}}
            />
        );
        expect(getByText('Basic Plan')).toBeInTheDocument();
    });
    it('displays monthly price when selectedType is Monthly', () => {
        const { getByText } = render(
            <PlanCard
                planId={1}
                features={[]}
                planName="Basic Plan"
                image_url=""
                selectedType="Monthly"
                monthlyPrice={100}
                yearlyPrice={1000}
                descriptions={[]}
                handlePurchase={() => {}}
            />
        );
        expect(getByText('INR 100')).toBeInTheDocument();
        expect(getByText('/user/monthly')).toBeInTheDocument();
    });

    it('displays yearly price when selectedType is Yearly', () => {
        const { getByText } = render(
            <PlanCard
                planId={1}
                features={[]}
                planName="Basic Plan"
                image_url=""
                selectedType="Yearly"
                monthlyPrice={100}
                yearlyPrice={1000}
                descriptions={[]}
                handlePurchase={() => {}}
            />
        );
        expect(getByText('INR 1000')).toBeInTheDocument();
        expect(getByText('/user/yearly')).toBeInTheDocument();
    });

    it('renders features list', () => {
        const features = [
            { label: 'Storage', value: '10GB' },
            { label: 'Support', value: '24/7' },
        ];
        const { getByText } = render(
            <PlanCard
                planId={1}
                features={features}
                planName="Basic Plan"
                image_url=""
                selectedType="Monthly"
                monthlyPrice={100}
                yearlyPrice={1000}
                descriptions={[]}
                handlePurchase={() => {}}
            />
        );
        expect(getByText('Storage')).toBeInTheDocument();
        expect(getByText('10GB')).toBeInTheDocument();
        expect(getByText('Support')).toBeInTheDocument();
        expect(getByText('24/7')).toBeInTheDocument();
    });

    it('calls handlePurchase when the purchase button is clicked', () => {
        const handlePurchaseMock = vi.fn();
        const { getByText } = render(
            <PlanCard
                planId={1}
                features={[]}
                planName="Basic Plan"
                image_url=""
                selectedType="Monthly"
                monthlyPrice={100}
                yearlyPrice={1000}
                descriptions={[]}
                handlePurchase={handlePurchaseMock}
            />
        );

        const button = getByText('Purchase');
        fireEvent.click(button);
        expect(handlePurchaseMock).toHaveBeenCalledTimes(1);
    });

    it('renders the image', () => {
        const { getByAltText } = render(
            <PlanCard
                planId={1}
                features={[]}
                planName="Basic Plan"
                image_url="/path/to/image.png"
                selectedType="Monthly"
                monthlyPrice={100}
                yearlyPrice={1000}
                descriptions={[]}
                handlePurchase={() => {}}
            />
        );

        const image = getByAltText('Plan Image');
        expect(image).toHaveAttribute('src', '/path/to/image.png');
    });
});
