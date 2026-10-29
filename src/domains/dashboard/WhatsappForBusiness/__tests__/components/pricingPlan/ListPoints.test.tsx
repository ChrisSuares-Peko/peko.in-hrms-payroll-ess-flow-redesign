import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

import ListPoints from '../../../components/pricingPlan/ListPoints';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <img src={src} alt="tick-icon" />,
}));

describe('ListPoints Component', () => {
    test('renders items with ticks', () => {
        const itemsWithTicks = ['Item 1', 'Item 2', 'Item 3'];
        render(<ListPoints itemsWithTicks={itemsWithTicks} />);

        itemsWithTicks.forEach(item => {
            expect(screen.getByText(item)).toBeInTheDocument();
            expect(screen.getAllByAltText('tick-icon')).toHaveLength(itemsWithTicks.length);
        });
    });

    test('renders items without ticks', () => {
        const itemsWithoutTicks = ['Item A', 'Item B'];
        render(<ListPoints itemsWithTicks={[]} itemsWithoutTicks={itemsWithoutTicks} />);

        itemsWithoutTicks.forEach(item => {
            expect(screen.getByText(item)).toBeInTheDocument();
        });
    });

    test('renders divider when itemsWithoutTicks is present', () => {
        const { container } = render(
            <ListPoints itemsWithTicks={['Item 1']} itemsWithoutTicks={['Item A']} />
        );

        expect(container.querySelector('.ant-divider')).toBeInTheDocument();
    });

    test('does not render divider when itemsWithoutTicks is empty', () => {
        const { container } = render(<ListPoints itemsWithTicks={['Item 1']} />);

        expect(container.querySelector('.ant-divider')).not.toBeInTheDocument();
    });
});
