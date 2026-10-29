import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ProgressList, { ProgressRow } from '../../../components/common/ProgressList';

const makeRow = (overrides: Partial<ProgressRow> = {}): ProgressRow => ({
    key: 'r1',
    label: 'Faris Ahammedali •• 5388',
    valueText: '₹0.00 / ₹10,000.00',
    percent: 0,
    color: '#22c55e',
    ...overrides,
});

describe('ProgressList', () => {
    // ADO 29049 — a card with ₹0.00 utilisation still showed a small visible dot on its bar, because
    // the sub-1% "keep a sliver visible" clamp applied even to a true, exact 0.
    it('renders a fully empty bar (0% width) for a row with 0 percent', () => {
        const { container } = render(<ProgressList rows={[makeRow({ percent: 0 })]} />);
        const fill = container.querySelector('.rounded-full.transition-all') as HTMLElement;
        expect(fill.style.width).toBe('0%');
    });

    it('still shows a minimum 2% sliver for a genuinely non-zero but sub-1% row', () => {
        const { container } = render(<ProgressList rows={[makeRow({ percent: 0.4 })]} />);
        const fill = container.querySelector('.rounded-full.transition-all') as HTMLElement;
        expect(fill.style.width).toBe('2%');
    });

    it('renders the exact percent for a normal in-range value', () => {
        const { container } = render(<ProgressList rows={[makeRow({ percent: 45 })]} />);
        const fill = container.querySelector('.rounded-full.transition-all') as HTMLElement;
        expect(fill.style.width).toBe('45%');
    });

    it('clamps a percent above 100 down to 100%', () => {
        const { container } = render(<ProgressList rows={[makeRow({ percent: 140 })]} />);
        const fill = container.querySelector('.rounded-full.transition-all') as HTMLElement;
        expect(fill.style.width).toBe('100%');
    });
});
