import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import StatCardsSkeleton from '../../../components/shared/StatCardsSkeleton';

describe('StatCardsSkeleton', () => {
    it('renders default 2 cards when count is omitted', () => {
        const { container } = render(<StatCardsSkeleton />);

        // Each card has 1 avatar + 1 button + 2 inputs = 4 skeleton parts.
        // Count avatars = number of cards.
        expect(container.querySelectorAll('.ant-skeleton-avatar').length).toBe(2);
    });

    it('renders the requested number of cards', () => {
        const { container } = render(<StatCardsSkeleton count={4} />);

        expect(container.querySelectorAll('.ant-skeleton-avatar').length).toBe(4);
    });
});
