import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SendSuccessModal from '../../../components/sendForSignature/SendSuccessModal';

describe('SendSuccessModal', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        onTrackStatus: vi.fn(),
        signerCount: 2,
    };

    it('should render when open is true', () => {
        render(<SendSuccessModal {...defaultProps} />);

        expect(screen.getByText('Sent successfully!')).toBeInTheDocument();
    });

    it('should not render content when open is false', () => {
        render(<SendSuccessModal {...defaultProps} open={false} />);

        expect(screen.queryByText('Sent successfully!')).not.toBeInTheDocument();
    });

    it('should show plural "signers" when signerCount > 1', () => {
        render(<SendSuccessModal {...defaultProps} signerCount={3} />);

        expect(screen.getByText(/E-sign requests sent to 3 signers via email/)).toBeInTheDocument();
    });

    it('should show singular "signer" when signerCount is 1', () => {
        render(<SendSuccessModal {...defaultProps} signerCount={1} />);

        expect(screen.getByText(/E-sign requests sent to 1 signer via email/)).toBeInTheDocument();
    });

    it('should call onClose when Close button is clicked', () => {
        const onClose = vi.fn();
        render(<SendSuccessModal {...defaultProps} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: /close/i }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onTrackStatus when Track status button is clicked', () => {
        const onTrackStatus = vi.fn();
        render(<SendSuccessModal {...defaultProps} onTrackStatus={onTrackStatus} />);

        fireEvent.click(screen.getByRole('button', { name: /track status/i }));

        expect(onTrackStatus).toHaveBeenCalledTimes(1);
    });

    it('should show notification text about receiving a notification', () => {
        render(<SendSuccessModal {...defaultProps} />);

        expect(screen.getByText(/You will receive a notification/)).toBeInTheDocument();
    });
});
