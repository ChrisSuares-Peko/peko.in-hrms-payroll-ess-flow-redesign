import { render, screen, fireEvent } from '@testing-library/react';
import { describe, vi, it, expect } from 'vitest';

import PriceTag from '../../components/PriceTag';

describe('PriceTag Component', () => {
    const mockOnClick = vi.fn();

    it('renders the price correctly', () => {
        render(<PriceTag price={100} onClick={mockOnClick} selected={false} />);
        expect(screen.getByText('₹ 100.00')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        render(<PriceTag price={200} onClick={mockOnClick} selected={false} />);
        fireEvent.click(screen.getByText('₹ 200.00'));
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('applies correct styles when selected', () => {
        render(<PriceTag price={300} onClick={mockOnClick} selected />);
        const tag = screen.getByText('₹ 300.00');
        expect(tag).toHaveClass('border border-brandPrimary bg-stone-50 text-brandPrimary');
    });

    it('applies correct styles when not selected', () => {
        render(<PriceTag price={400} onClick={mockOnClick} selected={false} />);
        const tag = screen.getByText('₹ 400.00');
        expect(tag).toHaveClass('text-black');
    });
});
