import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import CardRowsSkeleton from '../../../components/shared/CardRowsSkeleton';

describe('CardRowsSkeleton', () => {
    it('renders default 5 rows when count is omitted', () => {
        const { container } = render(<CardRowsSkeleton />);

        // Each row contains a flex with two Skeleton.Input elements; count rows by outer flex children.
        // Count anchored to inner skeleton avatars/inputs is more reliable: each row has 3 Skeleton.Input.
        const inputs = container.querySelectorAll('.ant-skeleton-input');
        expect(inputs.length).toBe(5 * 3);
    });

    it('renders the requested count of rows', () => {
        const { container } = render(<CardRowsSkeleton count={2} />);
        expect(container.querySelectorAll('.ant-skeleton-input').length).toBe(2 * 3);
    });
});
