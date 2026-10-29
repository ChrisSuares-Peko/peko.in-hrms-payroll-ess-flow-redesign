import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PaymentOptions from '../../components/PaymentOptions';

describe('PaymentOptions Component', () => {
    const mockHandleSelection = vi.fn();
    const defaultProps = {
        optionName: 'Test Option',
        image: 'test-image.png',
        handleSelection: mockHandleSelection,
    };

    it('renders correctly with required props', () => {
        render(<PaymentOptions {...defaultProps} />);
        expect(screen.getByText('Test Option')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /logo/i })).toBeInTheDocument();
    });

    it('renders walletAmount when provided', () => {
        render(<PaymentOptions {...defaultProps} walletAmount={500} />);
        expect(screen.getByText('₹ 500')).toBeInTheDocument();
    });

    it('does not render walletAmount when not provided', () => {
        render(<PaymentOptions {...defaultProps} />);
        expect(screen.queryByText('₹')).not.toBeInTheDocument();
    });

    it('calls handleSelection when clicked (not disabled)', () => {
        render(<PaymentOptions {...defaultProps} />);
        fireEvent.click(screen.getByText('Test Option')); // Select by text
        expect(mockHandleSelection).toHaveBeenCalledTimes(1);
    });

    it('applies "border-bgOrange2" class when checked is true', () => {
        const { container } = render(<PaymentOptions {...defaultProps} checked />);
        expect(container.firstChild).toHaveClass('border-bgOrange2');
    });

    it('applies "cursor-not-allowed opacity-60" class when disabled', () => {
        const { container } = render(<PaymentOptions {...defaultProps} disabled />);
        expect(container.firstChild).toHaveClass('cursor-not-allowed opacity-60');
    });
});
