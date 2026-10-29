import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SignatoryCard from '../../../components/documentDetail/SignatoryCard';

describe('SignatoryCard', () => {
    const defaultProps = {
        initials: 'JD',
        name: 'John Doe',
        email: 'john@example.com',
        date: '15 Jan 2024',
        status: 'Signed' as const,
    };

    it('should render name, email and date', () => {
        render(<SignatoryCard {...defaultProps} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
    });

    it('should render initials', () => {
        render(<SignatoryCard {...defaultProps} />);

        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should show "Signed" status with green styling', () => {
        render(<SignatoryCard {...defaultProps} status="Signed" />);

        expect(screen.getByText('Signed')).toBeInTheDocument();
        const badge = screen.getByText('Signed').closest('.rounded-full');
        expect(badge).toHaveClass('bg-emerald-50');
    });

    it('should show "Pending" status with yellow styling', () => {
        render(<SignatoryCard {...defaultProps} status="Pending" />);

        expect(screen.getByText('Pending')).toBeInTheDocument();
        const badge = screen.getByText('Pending').closest('.rounded-full');
        expect(badge).toHaveClass('bg-yellow-50');
    });

    it('should show check icon when status is Signed', () => {
        const { container } = render(<SignatoryCard {...defaultProps} status="Signed" />);

        expect(container.querySelector('.anticon-check-circle')).toBeInTheDocument();
    });

    it('should not show check icon when status is Pending', () => {
        const { container } = render(<SignatoryCard {...defaultProps} status="Pending" />);

        expect(container.querySelector('.anticon-check-circle')).not.toBeInTheDocument();
    });
});
