import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import DashboardCard from '../../../components/landingPage/DashboardCard'; // Adjust the import based on your file structure

describe('DashboardCard Component', () => {
    const mockRef = { current: null };
    const mockProps = {
        bgColor: 'bg-gray-100',
        icon: '/test-icon.svg',
        title: 'Test Title',
        value: '100',
        currency: '$',
        reference: mockRef,
        className: 'test-class',
    };

    it('renders the DashboardCard component correctly', () => {
        render(<DashboardCard {...mockProps} />);

        expect(screen.getAllByText('Test Title').length).toBeGreaterThan(0);

        // Check if the value is rendered correctly
        expect(screen.getByText('100')).toBeInTheDocument();

        // Check if the currency symbol is rendered
        expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('renders the icon correctly', () => {
        render(<DashboardCard {...mockProps} />);

        // Ensure the SVG icon is present
        expect(screen.getByTestId('icon-svg')).toBeInTheDocument();
    });

    it('applies the correct background and class names', () => {
        const { container } = render(<DashboardCard {...mockProps} />);

        // Check if the correct className is applied
        expect(container.firstChild).toHaveClass('bg-gray-100');
        expect(container.firstChild).toHaveClass('test-class');
    });
});
