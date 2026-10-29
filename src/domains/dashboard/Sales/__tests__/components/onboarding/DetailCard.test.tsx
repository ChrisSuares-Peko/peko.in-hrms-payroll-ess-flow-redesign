import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import DetailCard from '../../../components/onboarding/DetailCard';

describe('DetailCard', () => {
    it('renders label, title and subText', () => {
        render(<DetailCard label="Bank" title="HDFC - 1234" subText="IFSC HDFC0001234" />);

        expect(screen.getByText('Bank')).toBeInTheDocument();
        expect(screen.getByText('HDFC - 1234')).toBeInTheDocument();
        expect(screen.getByText('IFSC HDFC0001234')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        render(
            <DetailCard
                label="Bank"
                title="X"
                icon={<span data-testid="custom-icon" />}
            />
        );

        expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('renders action element when provided alongside other content', () => {
        render(
            <DetailCard
                label="Bank"
                title="X"
                action={<button type="button">Edit</button>}
            />
        );

        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    it('renders children layout instead of action when children are provided', () => {
        render(
            <DetailCard label="Bank" title="X">
                <div data-testid="custom-children" />
            </DetailCard>
        );

        expect(screen.getByTestId('custom-children')).toBeInTheDocument();
    });
});
