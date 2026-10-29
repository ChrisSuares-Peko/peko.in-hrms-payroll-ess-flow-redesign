import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import RequestUnfreezeModal from '../../../../components/landingPage/myCards/RequestUnfreezeModal';
import { useUnfreezeRequestApi } from '../../../../hooks/user/useUnfreezeRequestApi';
import { MyCard } from '../../../../utils/types';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'api/showToast', payload })),
}));

vi.mock('../../../../hooks/user/useUnfreezeRequestApi', () => ({
    useUnfreezeRequestApi: vi.fn(),
}));

vi.mock('../../../../components/common/CardThumb', () => ({
    default: () => <div data-testid="card-thumb" />,
}));

vi.mock('../../../../components/common/modalProps', () => ({
    MODAL_CLOSE_ICON: null,
    ROUNDED_MODAL_CLASSNAMES: {},
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
}));

const mockSubmit = vi.fn();
const mockDispatch = vi.fn();
const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

const card: MyCard = {
    key: '7',
    holder: 'Jane Doe',
    kind: 'Virtual Card',
    status: 'Frozen',
    last4: '1234',
    used: 100,
    limit: 1000,
    freezeReasonLabel: 'Stolen',
};

const renderModal = (override: Partial<MyCard> = {}) =>
    render(
        <RequestUnfreezeModal
            card={{ ...card, ...override }}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
        />
    );

describe('RequestUnfreezeModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useUnfreezeRequestApi as Mock).mockReturnValue({
            submitUnfreezeRequest: mockSubmit,
            isLoading: false,
        });
    });

    it('renders nothing when no card is selected', () => {
        render(<RequestUnfreezeModal card={null} onClose={mockOnClose} />);
        expect(screen.queryByText('Request unfreeze')).toBeNull();
    });

    it('shows the card and why it was frozen', () => {
        renderModal();
        expect(screen.getByText(/1234/)).toBeInTheDocument();
        expect(screen.getByText('Stolen')).toBeInTheDocument();
    });

    it('prefers the admin free-text note over the reason label', () => {
        renderModal({ freezeReasonNote: 'Reported lost in transit' });
        expect(screen.getByText('Reported lost in transit')).toBeInTheDocument();
    });

    // The reason is optional, so an empty box must submit; a 1-9 char note is rejected as too short.
    it('allows an empty reason but rejects a too-short one', () => {
        renderModal();
        const submit = screen.getByText('Send request').closest('button');
        expect(submit).not.toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('Enter'), { target: { value: 'short' } });
        expect(submit).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('Enter'), {
            target: { value: 'I need this card for a client trip' },
        });
        expect(submit).not.toBeDisabled();
    });

    it('submits the card id with the trimmed reason, then toasts and closes', async () => {
        mockSubmit.mockResolvedValue({ data: {} });
        renderModal();

        fireEvent.change(screen.getByPlaceholderText('Enter'), {
            target: { value: '  I need this card for a client trip  ' },
        });
        fireEvent.click(screen.getByText('Send request'));

        await waitFor(() =>
            expect(mockSubmit).toHaveBeenCalledWith({
                cardIssuanceId: '7',
                reason: 'I need this card for a client trip',
            })
        );
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({ payload: expect.objectContaining({ variant: 'success' }) })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('omits the reason entirely when the box is left empty', async () => {
        mockSubmit.mockResolvedValue({ data: {} });
        renderModal();

        fireEvent.click(screen.getByText('Send request'));

        await waitFor(() =>
            expect(mockSubmit).toHaveBeenCalledWith({ cardIssuanceId: '7', reason: undefined })
        );
    });

    // The api fn swallows the error and the shared ApiClient interceptor has already toasted it — a second
    // toast here would double up, and closing would lose what the user typed.
    it('keeps the modal open with no extra toast when the request fails', async () => {
        mockSubmit.mockResolvedValue(false);
        renderModal();

        fireEvent.click(screen.getByText('Send request'));

        await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockOnSuccess).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });
});
