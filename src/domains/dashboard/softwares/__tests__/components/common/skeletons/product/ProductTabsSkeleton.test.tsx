/**
 * @file ProductTabsSkeleton.test.tsx
 * @description Unit tests for ProductTabsSkeleton component
 * Verifies:
 *  - Renders without crashing
 */

import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ProductTabsSkeleton from '../../../../../components/common/skeletons/product/ProductTabsSkeleton';

describe('ProductTabsSkeleton', () => {
    it('should render without crashing', () => {
        const { container } = render(<ProductTabsSkeleton />);
        expect(container).toBeTruthy();
    });
});
