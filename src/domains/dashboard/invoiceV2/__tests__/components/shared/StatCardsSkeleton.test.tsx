import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StatCardsSkeleton from '../../../components/shared/StatCardsSkeleton';

describe('StatCardsSkeleton', () => {
    it('renders 2 placeholders by default', () => {
        const { container } = render(<StatCardsSkeleton />);
        const cards = container.querySelectorAll('[class*="bg-[#F8FAFC]"]');
        expect(cards.length).toBe(2);
    });

    it('renders the requested number of placeholders', () => {
        const { container } = render(<StatCardsSkeleton count={4} />);
        const cards = container.querySelectorAll('[class*="bg-[#F8FAFC]"]');
        expect(cards.length).toBe(4);
    });
});
