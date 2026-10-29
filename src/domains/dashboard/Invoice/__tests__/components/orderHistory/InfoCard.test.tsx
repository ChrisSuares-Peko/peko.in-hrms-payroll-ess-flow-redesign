import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import InfoCard from '../../../components/orderHistory/InfoCard';

describe('InfoCard Component', () => {
    const mockProps = {
        icon: '/icons/sample.svg',
        title: 'Total Sales',
        value: 1237.9,
        isCurrency: true,
        borderColor: 'border-blue-500',
    };

    it('should render the title and value correctly', () => {
        render(<InfoCard {...mockProps} />);

        expect(screen.getByText(mockProps.title)).toBeInTheDocument();

        expect(screen.getByText('₹')).toBeInTheDocument();
        expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('should render the icon correctly', () => {
        render(<InfoCard {...mockProps} />);

        const iconDivParent = screen.getByText('Total Sales').closest('div');
        const iconDiv = iconDivParent ? iconDivParent.querySelector('[data-src]') : null;

        expect(iconDiv).toHaveAttribute('data-src', '/icons/sample.svg');
    });

    it('should apply the correct border color class', () => {
        const { container } = render(<InfoCard {...mockProps} />);

        expect(container.firstChild).toHaveClass(mockProps.borderColor);
    });

    it('should display value without currency symbol when isCurrency is false', () => {
        render(<InfoCard {...mockProps} isCurrency={false} />);

        expect(screen.queryByText('₹')).not.toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });
});
