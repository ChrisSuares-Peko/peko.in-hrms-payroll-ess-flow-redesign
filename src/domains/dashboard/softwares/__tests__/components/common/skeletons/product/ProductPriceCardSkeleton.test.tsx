/**
 * @file ProductPriceCardSkeleton.test.tsx
 * @description Unit tests for ProductPriceCardSkeleton component
 * Verifies:
 *  - Renders without crashing
 */

import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ProductPriceCardSkeleton from '../../../../../components/common/skeletons/product/ProductPriceCardSkeleton';

describe('ProductPriceCardSkeleton', () => {
    it('should render without crashing', () => {
        const { container } = render(<ProductPriceCardSkeleton />);
        expect(container).toBeTruthy();
    });
});
