import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InitiateKyc from '../../../components/kyc/InitiateKyc';
import { KYC_INTRO } from '../../../utils/kycData';

vi.mock('../../../components/kyc/RequirementRow', () => ({
    default: ({ item }: { item: { label: string } }) => <div>{item.label}</div>,
}));

const renderScreen = () => render(<InitiateKyc onInitiate={vi.fn()} />);

describe('InitiateKyc — the terms and conditions link', () => {
    it('points at the Pine Perks terms page', () => {
        renderScreen();

        expect(screen.getByRole('link', { name: KYC_INTRO.termsLinkLabel })).toHaveAttribute(
            'href',
            'https://www.pineperks.in/termsConditions?lang=english#peko'
        );
    });

    it('opens in a new tab without handing the opener to the terms page', () => {
        renderScreen();
        const link = screen.getByRole('link', { name: KYC_INTRO.termsLinkLabel });

        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    it('sits above the button it qualifies, not below it', () => {
        renderScreen();
        const link = screen.getByRole('link', { name: KYC_INTRO.termsLinkLabel });
        const button = screen.getByRole('button', { name: KYC_INTRO.ctaLabel });

        expect(link.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
});
