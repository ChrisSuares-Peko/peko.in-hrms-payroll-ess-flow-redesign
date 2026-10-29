import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TrademarkReviewStep from '../../components/TrademarkReviewStep';
import { EMPTY_VALUES } from '../../utils/trademarkForm';

const onConfirmChange = vi.fn();
const onEdit = vi.fn();
const onBack = vi.fn();
const onSubmit = vi.fn();

const renderStep = (props: Partial<Parameters<typeof TrademarkReviewStep>[0]> = {}) =>
    render(
        <TrademarkReviewStep
            values={{ ...EMPTY_VALUES, brand: 'Peko' }}
            ownerName="Peko Pvt Ltd"
            logoFileName="logo.png"
            isPreviewConfirmed
            onConfirmChange={onConfirmChange}
            onEdit={onEdit}
            onBack={onBack}
            onSubmit={onSubmit}
            isSubmittingFiling={false}
            engagementId="ENG-1"
            {...props}
        />
    );

const submitButton = () => screen.getByRole('button', { name: /Submit Application/ });

describe('TrademarkReviewStep', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the preview summary', () => {
        renderStep();

        expect(screen.getByText('Peko Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('logo.png')).toBeInTheDocument();
    });

    it('enables submit when confirmed and paid, and calls onSubmit', () => {
        renderStep();

        expect(submitButton()).toBeEnabled();
        fireEvent.click(submitButton());
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(/Payment for this application/)).not.toBeInTheDocument();
    });

    it('disables submit until the details are confirmed', () => {
        renderStep({ isPreviewConfirmed: false });

        expect(submitButton()).toBeDisabled();
    });

    it('disables submit and shows the payment notice without an engagement id', () => {
        renderStep({ engagementId: null });

        expect(submitButton()).toBeDisabled();
        expect(screen.getByText(/Payment for this application hasn.t completed yet/)).toBeInTheDocument();
    });

    it('reports checkbox changes', () => {
        renderStep({ isPreviewConfirmed: false });

        fireEvent.click(screen.getByRole('checkbox'));
        expect(onConfirmChange).toHaveBeenCalledWith(true);
    });

    it('calls onBack from the Back button', () => {
        renderStep();

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
