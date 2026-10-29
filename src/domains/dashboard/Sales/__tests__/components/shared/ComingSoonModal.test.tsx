import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import ComingSoonModal from '../../../components/shared/ComingSoonModal';

vi.mock('../../../components/shared/CenteredHeader', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));

describe('ComingSoonModal', () => {
    it('renders title, description and Got it button', () => {
        render(
            <ComingSoonModal
                open
                onClose={() => {}}
                title="Coming Soon"
                description="Please check back"
            />
        );

        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(screen.getByText('Please check back')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument();
    });

    it('triggers onClose when Got it is clicked', () => {
        const onClose = vi.fn();
        render(<ComingSoonModal open onClose={onClose} title="x" description="y" />);

        fireEvent.click(screen.getByRole('button', { name: /got it/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
