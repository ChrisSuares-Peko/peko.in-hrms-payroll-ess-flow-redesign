import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import InfoCard from '../../../components/shared/InfoCard';

describe('InfoCard', () => {
    it('renders the title and each item', () => {
        render(<InfoCard title="Notes" items={['Item A', 'Item B']} />);

        expect(screen.getByText('Notes')).toBeInTheDocument();
        expect(screen.getByText('Item A')).toBeInTheDocument();
        expect(screen.getByText('Item B')).toBeInTheDocument();
    });

    it('renders the title icon when provided', () => {
        render(
            <InfoCard title="With Icon" items={['x']} titleIcon={<span data-testid="t-icon" />} />
        );
        expect(screen.getByTestId('t-icon')).toBeInTheDocument();
    });

    it('renders a custom itemsIcon instead of the bullet', () => {
        render(
            <InfoCard
                title="Icons"
                items={['only item']}
                itemsIcon={<span data-testid="bullet" />}
            />
        );

        expect(screen.getByTestId('bullet')).toBeInTheDocument();
        expect(screen.queryByText('•')).not.toBeInTheDocument();
    });
});
