import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import MyCardCard from '../../../../components/landingPage/myCards/MyCardCard';
import { MyCard } from '../../../../utils/types';

vi.mock('antd', () => ({
    Button: ({ children, disabled, onClick }: any) => (
        <button type="button" disabled={disabled} onClick={onClick}>
            {children}
        </button>
    ),
    Tooltip: ({ children, title }: any) => <span data-tooltip={title}>{children}</span>,
    Typography: {
        Text: ({ children, className }: any) => <span className={className}>{children}</span>,
    },
}));

vi.mock('../../../../components/common/PekoCard', () => ({
    default: () => <div data-testid="peko-card" />,
}));

const baseCard: MyCard = {
    key: '1',
    holder: 'Jane Doe',
    kind: 'Virtual Card',
    status: 'Frozen',
    last4: '1234',
    used: 100,
    limit: 1000,
};

describe('MyCardCard — termination lock', () => {
    it('enables Unfreeze on a plain frozen card (no termination request)', () => {
        render(<MyCardCard card={baseCard} onUnfreeze={vi.fn()} />);
        expect(screen.getByText('Unfreeze')).not.toBeDisabled();
    });

    // A bare `disabled` left the cardholder guessing why; the reason is now on hover.
    it('disables Unfreeze and explains on hover once a termination is in flight', () => {
        render(
            <MyCardCard
                card={{ ...baseCard, terminationStatus: 'REQUESTED' }}
                onUnfreeze={vi.fn()}
            />
        );
        expect(screen.getByText('Unfreeze')).toBeDisabled();
        expect(
            screen.getByText('Unfreeze').closest('[data-tooltip]')?.getAttribute('data-tooltip')
        ).toMatch(/being terminated/);
    });

    it('disables Unfreeze and explains on hover once a termination has completed', () => {
        render(
            <MyCardCard
                card={{ ...baseCard, terminationStatus: 'COMPLETED' }}
                onUnfreeze={vi.fn()}
            />
        );
        expect(screen.getByText('Unfreeze')).toBeDisabled();
        expect(
            screen.getByText('Unfreeze').closest('[data-tooltip]')?.getAttribute('data-tooltip')
        ).toMatch(/permanently terminated/);
    });

    it('still shows the "Frozen" pill for a termination-locked card (status is never overridden)', () => {
        render(
            <MyCardCard
                card={{ ...baseCard, terminationStatus: 'COMPLETED' }}
                onUnfreeze={vi.fn()}
            />
        );
        expect(screen.getAllByText('Frozen').length).toBeGreaterThan(0);
    });

    it('disables Freeze Card and explains on hover for a termination-locked active card', () => {
        render(
            <MyCardCard card={{ ...baseCard, status: 'Active', terminationStatus: 'REQUESTED' }} />
        );
        expect(screen.getByText('Freeze Card')).toBeDisabled();
        expect(
            screen.getByText('Freeze Card').closest('[data-tooltip]')?.getAttribute('data-tooltip')
        ).toMatch(/being terminated/);
    });
});

// The card renders one "Unfreeze" button whoever placed the freeze — MyCardsTab decides on click whether to
// unfreeze directly or open the request popup.
describe('MyCardCard — admin freeze', () => {
    const adminFrozen: MyCard = { ...baseCard };

    it('keeps the label "Unfreeze" and never shows request-flavoured button text', () => {
        render(<MyCardCard card={adminFrozen} onUnfreeze={vi.fn()} />);
        expect(screen.getByText('Unfreeze')).toBeInTheDocument();
        expect(screen.queryByText('Request unfreeze')).toBeNull();
        expect(screen.queryByText('Unfreeze requested')).toBeNull();
    });

    it('leaves the button live so the click can open the request popup', () => {
        const onUnfreeze = vi.fn();
        render(<MyCardCard card={adminFrozen} onUnfreeze={onUnfreeze} />);

        const button = screen.getByText('Unfreeze');
        expect(button).not.toBeDisabled();
        fireEvent.click(button);
        expect(onUnfreeze).toHaveBeenCalledWith(adminFrozen);
    });

    // Re-opening the popup would only let them submit a duplicate the backend 409s.
    it('disables Unfreeze and explains on hover once a request is already pending', () => {
        const onUnfreeze = vi.fn();
        render(
            <MyCardCard
                card={{ ...adminFrozen, unfreezeRequestStatus: 'PENDING' }}
                onUnfreeze={onUnfreeze}
            />
        );

        const button = screen.getByText('Unfreeze');
        expect(button).toBeDisabled();
        expect(button.closest('[data-tooltip]')?.getAttribute('data-tooltip')).toMatch(
            /already requested an unfreeze/
        );
        fireEvent.click(button);
        expect(onUnfreeze).not.toHaveBeenCalled();
    });

    it('renders no explanatory banner on the card', () => {
        render(<MyCardCard card={adminFrozen} />);
        expect(screen.queryByText(/Frozen by your admin/)).toBeNull();
    });
});
