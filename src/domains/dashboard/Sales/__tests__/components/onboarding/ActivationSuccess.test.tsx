import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ActivationSuccess from '../../../components/onboarding/ActivationSuccess';

vi.mock('../../../components/shared/CenteredHeader', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

describe('ActivationSuccess', () => {
    it('renders the success header and virtual account when provided', () => {
        render(<ActivationSuccess onDone={() => {}} virtualAccount="VA-123456" />);

        expect(screen.getByText('Payment Collections Activated')).toBeInTheDocument();
        expect(screen.getByText('VA-123456')).toBeInTheDocument();
    });

    it('falls back to "PEKO - " when virtualAccount is missing', () => {
        render(<ActivationSuccess onDone={() => {}} />);

        expect(screen.getByText('PEKO -')).toBeInTheDocument();
    });

    it('invokes onDone when continue is clicked', () => {
        const onDone = vi.fn();
        render(<ActivationSuccess onDone={onDone} />);

        fireEvent.click(screen.getByRole('button', { name: /continue to dashboard/i }));
        expect(onDone).toHaveBeenCalled();
    });
});
