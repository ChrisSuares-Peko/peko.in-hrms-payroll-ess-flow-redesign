import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import WalletPanel from '../../../components/admin/WalletPanel';
import { useDashboardNav } from '../../../components/common/dashboardNav';
import { utilisationPercent } from '../../../utils/helpers';

vi.mock('../../../components/common/dashboardNav', () => ({
    useDashboardNav: vi.fn(),
}));

vi.mock('../../../utils/helpers', () => ({
    utilisationPercent: vi.fn(),
}));

vi.mock('../../../components/common/SectionCard', () => ({
    default: ({ title, action, children }: any) => (
        <div data-testid="section-card">
            <div data-testid="section-title">{title}</div>
            <div data-testid="section-action">{action}</div>
            <div data-testid="section-body">{children}</div>
        </div>
    ),
    ViewAllLink: ({ label, onClick }: any) => (
        <button type="button" data-testid="view-all-link" onClick={onClick}>
            {label ?? 'View all'}
        </button>
    ),
}));

const makeWallet = (
    overrides: Partial<{
        available: string;
        note: string;
        cardLimitsUsed: number;
        cardLimitsTotal: number;
        cardLimitsLabel: string;
        cardLimitsCaption: string;
        fundingAccountLast4: string;
        fundingAccountRef: string;
    }> = {}
) => ({
    available: 'â‚¹1,20,000',
    note: 'Balance refreshes daily at midnight.',
    cardLimitsUsed: 60000,
    cardLimitsTotal: 1000000,
    cardLimitsLabel: 'â‚¹60,000 / â‚¹10,00,000',
    cardLimitsCaption: '6% of total limit used',
    fundingAccountLast4: '4321',
    fundingAccountRef: 'REF-20240101',
    ...overrides,
});

describe('WalletPanel', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useDashboardNav as Mock).mockReturnValue(mockNavigate);
        (utilisationPercent as Mock).mockReturnValue(60);
    });

    describe('section structure', () => {
        it('renders the SectionCard with title "Wallet"', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByTestId('section-title')).toHaveTextContent('Wallet');
        });

        it('renders the ViewAllLink inside the section action slot', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByTestId('view-all-link')).toBeInTheDocument();
        });
    });

    describe('available balance', () => {
        it('renders the available balance value', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByText('â‚¹1,20,000')).toBeInTheDocument();
        });

        it('updates when a different available value is provided', () => {
            const { rerender } = render(
                <WalletPanel wallet={makeWallet({ available: 'â‚¹50,000' })} />
            );
            expect(screen.getByText('â‚¹50,000')).toBeInTheDocument();

            rerender(<WalletPanel wallet={makeWallet({ available: 'â‚¹2,50,000' })} />);
            expect(screen.getByText('â‚¹2,50,000')).toBeInTheDocument();
        });
    });

    describe('wallet note', () => {
        it('renders the note text below the balance', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByText('Balance refreshes daily at midnight.')).toBeInTheDocument();
        });

        it('renders a different note when the prop changes', () => {
            render(
                <WalletPanel
                    wallet={makeWallet({ note: 'Funds settle within 2 business days.' })}
                />
            );
            expect(screen.getByText('Funds settle within 2 business days.')).toBeInTheDocument();
        });
    });

    describe('progress bar', () => {
        it('calls utilisationPercent with cardLimitsUsed and cardLimitsTotal', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(utilisationPercent).toHaveBeenCalledWith(60000, 1000000);
        });

        it('sets the bar width to the value returned by utilisationPercent', () => {
            (utilisationPercent as Mock).mockReturnValue(75);
            const { container } = render(<WalletPanel wallet={makeWallet()} />);
            const bar = container.querySelector('.bg-textLightRed') as HTMLElement;
            expect(bar.style.width).toBe('75%');
        });

        it('renders a 0% bar when utilisationPercent returns 0', () => {
            (utilisationPercent as Mock).mockReturnValue(0);
            const { container } = render(
                <WalletPanel wallet={makeWallet({ cardLimitsUsed: 0 })} />
            );
            const bar = container.querySelector('.bg-textLightRed') as HTMLElement;
            expect(bar.style.width).toBe('0%');
        });

        it('caps the bar width at 100% when utilisationPercent returns 100', () => {
            (utilisationPercent as Mock).mockReturnValue(100);
            const { container } = render(
                <WalletPanel wallet={makeWallet({ cardLimitsUsed: 1000000 })} />
            );
            const bar = container.querySelector('.bg-textLightRed') as HTMLElement;
            expect(bar.style.width).toBe('100%');
        });
    });

    describe('card limits section', () => {
        it('renders the card limits label in the grid', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByText('â‚¹60,000 / â‚¹10,00,000')).toBeInTheDocument();
        });

        it('renders the card limits caption', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByText('6% of total limit used')).toBeInTheDocument();
        });

        it('renders the card limits label inside the legend span as part of combined text', () => {
            render(
                <WalletPanel wallet={makeWallet({ cardLimitsLabel: 'â‚¹30,000 / â‚¹5,00,000' })} />
            );
            const legendSpan = screen.getByText('â‚¹30,000 / â‚¹5,00,000');
            expect(legendSpan).toBeInTheDocument();
        });
    });

    describe('funding account section', () => {
        it('renders the funding account masked number with bullet prefix', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByText('•• 4321')).toBeInTheDocument();
        });

        it('renders the funding account reference', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByText('REF-20240101')).toBeInTheDocument();
        });

        it('renders a different last4 when the prop changes', () => {
            render(<WalletPanel wallet={makeWallet({ fundingAccountLast4: '9876' })} />);
            expect(screen.getByText('•• 9876')).toBeInTheDocument();
        });

        it('renders a different reference when the prop changes', () => {
            render(<WalletPanel wallet={makeWallet({ fundingAccountRef: 'NEFT-XYZ-789' })} />);
            expect(screen.getByText('NEFT-XYZ-789')).toBeInTheDocument();
        });
    });

    describe('Top up wallet button', () => {
        it('renders the "Top up wallet" button', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            expect(screen.getByRole('button', { name: /top up wallet/i })).toBeInTheDocument();
        });

        it('the button is not disabled by default', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            const btn = screen.getByRole('button', { name: /top up wallet/i });
            expect(btn).not.toBeDisabled();
        });
    });

    describe('navigation', () => {
        it('calls navigate with "wallet" when the View link is clicked', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            fireEvent.click(screen.getByTestId('view-all-link'));
            expect(mockNavigate).toHaveBeenCalledWith('wallet');
        });

        it('calls navigate exactly once per click', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            fireEvent.click(screen.getByTestId('view-all-link'));
            expect(mockNavigate).toHaveBeenCalledTimes(1);
        });

        it('calls navigate again on each subsequent click', () => {
            render(<WalletPanel wallet={makeWallet()} />);
            const link = screen.getByTestId('view-all-link');
            fireEvent.click(link);
            fireEvent.click(link);
            expect(mockNavigate).toHaveBeenCalledTimes(2);
            expect(mockNavigate).toHaveBeenNthCalledWith(1, 'wallet');
            expect(mockNavigate).toHaveBeenNthCalledWith(2, 'wallet');
        });
    });
});
