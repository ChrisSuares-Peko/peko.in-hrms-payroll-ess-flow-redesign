import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import StatCard from '../../../components/shared/StatCard';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

describe('shared/StatCard', () => {
    const baseProps = {
        value: '1,000',
        label: 'Total',
        bgColor: '#FFF',
        icon: '/i.svg',
    };

    it('renders icon, label and value', () => {
        render(<StatCard {...baseProps} />);

        expect(screen.getByTestId('svg')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('renders growth badge when badge="growth" with positive value', () => {
        render(<StatCard {...baseProps} badge="growth" badgeValue="10" />);

        expect(screen.getByText('+10%')).toBeInTheDocument();
        expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('renders growth badge with negative value', () => {
        render(<StatCard {...baseProps} badge="growth" badgeValue="-5" />);

        expect(screen.getByText('-5%')).toBeInTheDocument();
    });

    it('renders text badge when badge="text"', () => {
        render(<StatCard {...baseProps} badge="text" badgeValue="3 invoices" />);

        expect(screen.getByText('3 invoices')).toBeInTheDocument();
    });

    it('omits badge when no badgeValue is provided', () => {
        render(<StatCard {...baseProps} badge="growth" />);

        expect(screen.queryByText(/vs last month/i)).not.toBeInTheDocument();
    });
});
