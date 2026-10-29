import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AlertCard from '../../../components/shared/AlertCard';

describe('AlertCard', () => {
    it('renders title, description, and reason', () => {
        render(
            <AlertCard
                variant="warning"
                title="Heads up"
                description="Something to look at"
                reason="not valid"
            />
        );
        expect(screen.getByText('Heads up')).toBeInTheDocument();
        expect(screen.getByText('Something to look at')).toBeInTheDocument();
        expect(screen.getByText('Reason: not valid')).toBeInTheDocument();
    });

    it('renders cancelledOn tag with formatted timestamp', () => {
        render(<AlertCard variant="error" title="Failed" cancelledOn="2026-05-12T05:00:00Z" />);
        expect(screen.getByText(/Cancelled on:/)).toBeInTheDocument();
    });

    it('renders without title or description', () => {
        const { container } = render(<AlertCard variant="info" />);
        expect(container).toBeInTheDocument();
    });

    it('accepts custom className', () => {
        const { container } = render(<AlertCard variant="success" className="custom-cls" />);
        expect(container.firstChild).toHaveClass('custom-cls');
    });
});
