import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import SelectionCardSkeleton from '../../../components/createAgreement/SelectionCardSkeleton';

describe('SelectionCardSkeleton', () => {
    it('renders four skeleton rows', () => {
        const { container } = render(<SelectionCardSkeleton />);

        const skeletonAvatars = container.querySelectorAll('.ant-skeleton-avatar');
        expect(skeletonAvatars.length).toBe(4);
    });
});
