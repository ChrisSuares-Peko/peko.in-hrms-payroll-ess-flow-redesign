import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GetStarted from '../../../components/onboarding/GetStarted';

describe('GetStarted', () => {
    it('renders header and Activate button', () => {
        render(<GetStarted onNext={vi.fn()} />);
        expect(screen.getByText('Get Started with Payment Collections')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Activate Payment Collections/i })
        ).toBeInTheDocument();
    });

    it('fires onNext when Activate button clicked', () => {
        const onNext = vi.fn();
        render(<GetStarted onNext={onNext} />);
        fireEvent.click(screen.getByRole('button', { name: /Activate Payment Collections/i }));
        expect(onNext).toHaveBeenCalled();
    });
});
