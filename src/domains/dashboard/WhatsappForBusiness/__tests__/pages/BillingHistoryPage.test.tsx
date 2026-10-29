import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import BillingHistoryPage from '../../pages/BillingHistoryPage';

vi.mock('../../components/billingHistory/BillingHistory', () => ({
    default: () => <div data-testid="billing-history">Billing History Content</div>,
}));

vi.mock('../../components/billingHistory/OrderTable', () => ({
    default: ({ refresh }: { refresh: boolean }) => (
        <div data-testid="orders-table">{refresh ? 'Refreshed' : 'Orders Table Content'}</div>
    ),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useLocation: vi.fn(),
    };
});

describe('BillingHistoryPage', () => {
    beforeEach(() => {
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 123 });
        (useLocation as Mock).mockReturnValue({ state: {} });
    });

    it('renders default active tab (Top Up History)', () => {
        render(
            <MemoryRouter>
                <BillingHistoryPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Top Up History')).toBeInTheDocument();
        expect(screen.getByTestId('billing-history')).toBeInTheDocument();
    });

    it('switches to Billing History tab on click', async () => {
        render(
            <MemoryRouter>
                <BillingHistoryPage />
            </MemoryRouter>
        );

        const billingTab = screen.getByText('Billing History');
        fireEvent.click(billingTab);
        screen.debug(undefined, 299999);
        await waitFor(() => {
            expect(screen.getByTestId('orders-table')).toBeInTheDocument();
            expect(screen.getByTestId('billing-history').parentElement).toHaveAttribute(
                'aria-hidden',
                'true'
            );
        });
    });

    it('handles initial active tab from location.state', () => {
        (useLocation as Mock).mockReturnValue({ state: { activeTab: '2' } });

        render(
            <MemoryRouter>
                <BillingHistoryPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('orders-table')).toBeInTheDocument();
    });
});
