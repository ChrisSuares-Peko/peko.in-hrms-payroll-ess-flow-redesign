import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import GetStarted from '../../../components/onboarding/GetStarted';

vi.mock('../../../components/shared/CenteredHeader', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

describe('GetStarted', () => {
    it('renders the heading and activate button', () => {
        render(<GetStarted onNext={() => {}} />);

        expect(screen.getByText('Get Started with Payment Collections')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /activate payment collections/i })
        ).toBeInTheDocument();
    });

    it('invokes onNext when the activate button is clicked', () => {
        const onNext = vi.fn();
        render(<GetStarted onNext={onNext} />);

        fireEvent.click(screen.getByRole('button', { name: /activate payment collections/i }));
        expect(onNext).toHaveBeenCalled();
    });
});
