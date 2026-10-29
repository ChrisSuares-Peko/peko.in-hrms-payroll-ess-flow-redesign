/**
 * @file ProductCardSkeleton.test.tsx
 * @description Unit tests for ProductCardSkeleton component
 * Verifies:
 *  - Renders nothing when isLoading is false
 *  - Renders skeleton items when isLoading is true
 */

import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import ProductCardSkeleton from '../../../../../components/common/skeletons/product/ProductCardSkeleton';

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ sm: true, md: true }),
}));

describe('ProductCardSkeleton', () => {
    it('should render nothing when isLoading is false', () => {
        const { container } = render(<ProductCardSkeleton isLoading={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render skeleton items when isLoading is true', () => {
        const { container } = render(<ProductCardSkeleton isLoading />);
        expect(container).toBeTruthy();
        expect(container.children.length).toBeGreaterThan(0);
    });
});
