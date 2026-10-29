import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import InfoCard from '../../../components/shared/InfoCard';

describe('InfoCard', () => {
    it('renders title and items', () => {
        render(<InfoCard title="Notes" items={['First', 'Second']} />);

        expect(screen.getByText('Notes')).toBeInTheDocument();
        expect(screen.getByText('First')).toBeInTheDocument();
        expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('renders titleIcon when provided', () => {
        render(
            <InfoCard
                title="Notes"
                items={['x']}
                titleIcon={<span data-testid="title-icon" />}
            />
        );
        expect(screen.getByTestId('title-icon')).toBeInTheDocument();
    });

    it('uses itemsIcon for each item when provided (no bullets)', () => {
        render(
            <InfoCard
                title="Notes"
                items={['a', 'b']}
                itemsIcon={<span data-testid="item-icon" />}
            />
        );

        expect(screen.getAllByTestId('item-icon')).toHaveLength(2);
    });
});
