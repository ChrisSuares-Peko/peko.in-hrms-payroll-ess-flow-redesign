import React from 'react';

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AadhaarConsentModal from '../../components/AadhaarConsentModal';
import useAadhaarVerification from '../../hooks/useAadhaarVerification';

vi.mock('../../hooks/useAadhaarVerification', () => ({ default: vi.fn() }));

describe('AadhaarConsentModal', () => {
    const mockStartPolling = vi.fn();
    const mockStopPolling = vi.fn();
    const onVerified = vi.fn();
    const handleCancel = vi.fn();
    let openSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        (useAadhaarVerification as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            startPolling: mockStartPolling,
            stopPolling: mockStopPolling,
        });
        openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    });

    const renderModal = () =>
        render(
            <AadhaarConsentModal
                isOpen
                link="https://digilocker.example/consent"
                referenceNumber="REF1"
                transactionId="TXN1"
                handleCancel={handleCancel}
                onVerified={onVerified}
            />
        );

    const getPollCallbacks = () => mockStartPolling.mock.calls[0][2];

    it('opens the verification link and starts polling once mounted with a link', () => {
        renderModal();

        expect(openSpy).toHaveBeenCalledWith('https://digilocker.example/consent', '_blank');
        expect(mockStartPolling).toHaveBeenCalledWith(
            'REF1',
            'TXN1',
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onFailed: expect.any(Function),
                onTimeout: expect.any(Function),
            })
        );
    });

    it('renders the waiting state with a Reopen Verification Link button', () => {
        renderModal();

        expect(
            screen.getByText(/Complete the Aadhaar verification in the new tab/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Reopen Verification Link')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Reopen Verification Link'));
        expect(openSpy).toHaveBeenCalledTimes(2);
    });

    it('calls onVerified when the poll callbacks report success', () => {
        renderModal();

        act(() => {
            getPollCallbacks().onSuccess({ status: 'success' });
        });

        expect(onVerified).toHaveBeenCalledWith({ status: 'success' });
    });

    it('shows Try Again and Cancel as two side-by-side buttons in the failed state', () => {
        renderModal();

        act(() => {
            getPollCallbacks().onFailed();
        });

        expect(
            screen.getByText('Aadhaar verification failed or was cancelled.')
        ).toBeInTheDocument();
        const tryAgain = screen.getByText('Try Again');
        const cancelButtons = screen.getAllByText('Cancel');
        expect(tryAgain).toBeInTheDocument();
        // Only the failed-state Cancel button should render (the generic bottom
        // link is hidden for this state).
        expect(cancelButtons).toHaveLength(1);

        fireEvent.click(cancelButtons[0]);
        expect(handleCancel).toHaveBeenCalled();
    });

    it('retries polling when Try Again is clicked in the failed state', () => {
        renderModal();

        act(() => {
            getPollCallbacks().onFailed();
        });

        mockStartPolling.mockClear();
        fireEvent.click(screen.getByText('Try Again'));

        expect(mockStartPolling).toHaveBeenCalledWith('REF1', 'TXN1', expect.any(Object));
    });

    it('shows a Check Status button and the generic Cancel link in the timeout state', () => {
        renderModal();

        act(() => {
            getPollCallbacks().onTimeout();
        });

        expect(
            screen.getByText(/Still processing\. This can take a few minutes/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Check Status')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
});
