/**
 * @file index.test.tsx
 * @description Unit tests for RatingsTab component
 * Verifies:
 *  - Renders RatingAndReviewSection and StrengthNWeakness child components
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import RatingsTab from '@src/domains/dashboard/softwares/components/product/sections/productDetails/ratingsTab/index';

vi.mock(
    '@src/domains/dashboard/softwares/components/product/sections/productDetails/ratingsTab/RatingAndReviewSection',
    () => ({ default: () => <div>RatingAndReviewSection</div> })
);
vi.mock(
    '@src/domains/dashboard/softwares/components/product/sections/productDetails/ratingsTab/StreangthNWeakness',
    () => ({ default: ({ title }: any) => <div>{title}</div> })
);

describe('RatingsTab', () => {
    it('should render all child sections', () => {
        render(<RatingsTab />);
        expect(screen.getByText('RatingAndReviewSection')).toBeInTheDocument();
        expect(screen.getByText('strength')).toBeInTheDocument();
        expect(screen.getByText('weakness')).toBeInTheDocument();
    });
});
