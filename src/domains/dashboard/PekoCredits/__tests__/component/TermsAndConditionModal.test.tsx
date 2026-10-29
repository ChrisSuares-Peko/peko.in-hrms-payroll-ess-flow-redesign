import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TermsAndConditionModal from '../../components/Modals/TermsAndCondtionModal';

describe('TermsAndConditionModal Component', () => {
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the modal with terms and conditions when open', () => {
        render(<TermsAndConditionModal isOpen handleClose={mockHandleClose} />);

        expect(screen.getByText('Terms and conditions apply')).toBeInTheDocument();

        const termsAndConditions = [
            'The coupon is valid exclusively for the specified service it is associated with.',
            'Each coupon can be redeemed only once and cannot be reused.',
            'The coupon cannot be combined with any other sales, promotions, or offers.',
            'All coupons must be redeemed within their validity period as specified.',
            'Coupons are non-transferable and can only be used by the intended recipient.',
            'Any misuse, fraudulent activity, or violation of these terms will lead to the immediate cancellation of the coupon.',
        ];

        termsAndConditions.forEach(term => {
            expect(screen.getByText(term)).toBeInTheDocument();
        });

        // Ensure our custom close button is present
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should call handleClose when the custom close button is clicked', () => {
        render(<TermsAndConditionModal isOpen handleClose={mockHandleClose} />);

        // Select the button by its exact text instead of role
        const closeButton = screen.getByText('Close');

        fireEvent.click(closeButton);

        expect(mockHandleClose).toHaveBeenCalledTimes(1);
    });

    it('should close the modal when clicking the Ant Design close button (X)', () => {
        render(<TermsAndConditionModal isOpen handleClose={mockHandleClose} />);

        // Select the Ant Design close button using the `aria-label`
        const antCloseButton = screen.getByLabelText('Close');

        fireEvent.click(antCloseButton);

        expect(mockHandleClose).toHaveBeenCalledTimes(1);
    });
});
