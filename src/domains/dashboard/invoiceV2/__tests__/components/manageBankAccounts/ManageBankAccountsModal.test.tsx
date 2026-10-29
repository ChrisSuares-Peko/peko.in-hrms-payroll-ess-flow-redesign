import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ManageBankAccountsModal from '../../../components/manageBankAccounts/ManageBankAccountsModal';

vi.mock('../../../components/manageBankAccounts/DomesticAccounts', () => ({
    default: () => <div data-testid="domestic-tab" />,
}));

vi.mock('../../../components/manageBankAccounts/VirtualAccounts', () => ({
    default: () => <div data-testid="virtual-tab" />,
}));

vi.mock('../../../components/manageBankAccounts/EscrowAccounts', () => ({
    default: () => <div data-testid="escrow-tab" />,
}));

describe('ManageBankAccountsModal', () => {
    it('renders with Domestic tab content visible by default', () => {
        render(
            <ManageBankAccountsModal
                open
                onClose={vi.fn()}
                virtualAccounts={[]}
                isVirtualAccountsLoading={false}
            />
        );

        expect(screen.getByText('Manage Bank Accounts')).toBeInTheDocument();
        expect(screen.getByTestId('domestic-tab')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Virtual Accounts/i })).toBeInTheDocument();
    });

    it('switches active tab when another tab is clicked', () => {
        render(
            <ManageBankAccountsModal
                open
                onClose={vi.fn()}
                virtualAccounts={[]}
                isVirtualAccountsLoading={false}
            />
        );

        const virtualBtn = screen.getByRole('button', { name: /Virtual Accounts/i });
        fireEvent.click(virtualBtn);

        expect(virtualBtn.className).toMatch(/FF4F4F/);
    });
});
