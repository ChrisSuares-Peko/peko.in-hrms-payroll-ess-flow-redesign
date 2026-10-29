import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ConsentConfirm from '../../../components/onboarding/ConsentConfirm';

vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../components/shared/InfoCard', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../components/onboarding/DetailCard', () => ({
    default: ({ label, title, subText }: any) => (
        <div>
            <span>{label}</span>
            <span>{title}</span>
            {subText && <span>{subText}</span>}
        </div>
    ),
}));

const data = {
    businessName: 'Acme',
    bankName: 'HDFC',
    accountNumber: '1234567890',
    ifsc: 'HDFC0001234',
};

describe('ConsentConfirm', () => {
    it('renders both detail cards and the InfoCard', () => {
        render(<ConsentConfirm data={data as any} consent={false} onConsentChange={() => {}} />);

        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('HDFC - 1234567890')).toBeInTheDocument();
        expect(screen.getByText('HDFC0001234')).toBeInTheDocument();
        expect(screen.getByText('About Settlements')).toBeInTheDocument();
    });

    it('reflects checkbox state and triggers onConsentChange', () => {
        const onConsentChange = vi.fn();
        render(
            <ConsentConfirm data={data as any} consent={false} onConsentChange={onConsentChange} />
        );

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);
        expect(onConsentChange).toHaveBeenCalledWith(true);
    });

    it('shows the checkbox as checked when consent is true', () => {
        render(<ConsentConfirm data={data as any} consent onConsentChange={() => {}} />);
        expect(screen.getByRole('checkbox')).toBeChecked();
    });
});
