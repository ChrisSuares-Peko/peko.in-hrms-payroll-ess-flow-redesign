/**
 * @file ProductTopSectionSkeleton.test.tsx
 * @description Unit tests for ProductTopSectionSkeleton component
 * Verifies:
 *  - Renders without crashing
 */

import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ProductTopSectionSkeleton from '../../../../../components/common/skeletons/product/ProductTopSectionSkeleton';

describe('ProductTopSectionSkeleton', () => {
    it('should render without crashing', () => {
        const { container } = render(<ProductTopSectionSkeleton />);
        expect(container).toBeTruthy();
    });
});
