/**
 * @file ContentHeadAndBody.test.tsx
 * @description Unit tests for ContentHeadAndBody component
 * Verifies:
 *  - Renders the header text
 *  - Renders textContent when provided
 *  - Renders children when textContent is null
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ContentHeadAndBody from '@src/domains/dashboard/softwares/components/product/sections/productDetails/ContentHeadAndBody';

describe('ContentHeadAndBody', () => {
    it('should render the header', () => {
        render(<ContentHeadAndBody header="Features" textContent="Some features text" />);
        expect(screen.getByText('Features')).toBeInTheDocument();
    });

    it('should render textContent when provided', () => {
        render(<ContentHeadAndBody header="Details" textContent="Product details here" />);
        expect(screen.getByText('Product details here')).toBeInTheDocument();
    });

    it('should render children when textContent is null', () => {
        render(
            <ContentHeadAndBody header="Custom" textContent={null}>
                <span>Child content</span>
            </ContentHeadAndBody>
        );
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });
});
