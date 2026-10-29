import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import PekoCard from '../../../components/common/PekoCard';
import { CardData } from '../../../utils/types';

vi.mock('../../../assets/eyeIcon.svg', () => ({ default: 'eyeIcon.svg' }));
vi.mock('../../../assets/india-gate.svg', () => ({ default: 'india-gate.svg' }));
vi.mock('../../../assets/logo2.svg', () => ({ default: 'logo2.svg' }));
vi.mock('../../../assets/peko-card-logo.svg', () => ({ default: 'peko-card-logo.svg' }));
vi.mock('../../../assets/rupay.png', () => ({ default: 'rupay.png' }));

const makeCard = (overrides: Partial<CardData> = {}): CardData => ({
    key: '1',
    holder: 'Leena Antony',
    last4: '1234',
    used: 0,
    limit: 50000,
    ...overrides,
});

describe('PekoCard', () => {
    it('renders the holder name row without a fixed top-margin class', () => {
        // ADO 28831 — a hardcoded mt-10 on this row pushed the FROM/TO/CVV/RuPay row
        // past the bottom edge of the aspect-ratio-constrained card on narrow mobile
        // widths, so it got clipped by the card's overflow-hidden container.
        render(<PekoCard card={makeCard()} />);
        const holderName = screen.getByText('Leena Antony');
        expect(holderName.parentElement?.className ?? '').not.toMatch(/\bmt-10\b/);
    });

    it('still renders the holder name and card number', () => {
        render(<PekoCard card={makeCard({ holder: 'Leena Antony' })} />);
        expect(screen.getByText('Leena Antony')).toBeInTheDocument();
        expect(screen.getByText('**** ****** ****')).toBeInTheDocument();
    });
});
