import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DetailCard from '../../../components/onboarding/DetailCard';

describe('DetailCard', () => {
    it('renders icon, label, title and subText with action', () => {
        render(
            <DetailCard
                icon={<span data-testid="icon" />}
                label="Business"
                title="Acme"
                subText="GST123"
                action={
                    <button type="button" data-testid="act">
                        Edit
                    </button>
                }
            />
        );
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByText('Business')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('GST123')).toBeInTheDocument();
        expect(screen.getByTestId('act')).toBeInTheDocument();
    });

    it('renders children instead of action when children provided', () => {
        render(
            <DetailCard label="Bank" action={<button type="button">action</button>}>
                <div data-testid="child" />
            </DetailCard>
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.queryByText('action')).not.toBeInTheDocument();
    });
});
