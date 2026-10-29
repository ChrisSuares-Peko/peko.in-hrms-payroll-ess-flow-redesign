/**
 * @file FindProductSuccess.test.tsx
 * @module FindProductSuccessPageTests
 * @description
 * Unit tests for the FindProductSuccess page component.
 *
 * This suite validates the structural composition of the page,
 * ensuring correct rendering of child components and layout styling.
 *
 * @coverage
 * - Renders Header and ProductCards
 * - Verifies layout container class
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import FindProductSuccess from '../../pages/FindProductSuccess';

/**
 * @mock Child components
 */
vi.mock('../../components/findProductSuccess', () => ({
    Header: () => <div data-testid="header">Header</div>,
    ProductCards: () => <div data-testid="product-cards">ProductCards</div>,
}));

describe('FindProductSuccess Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render all sections', () => {
        render(<FindProductSuccess />);

        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('product-cards')).toBeInTheDocument();
    });

    it('should apply correct layout class', () => {
        const { container } = render(<FindProductSuccess />);

        const layout = container.querySelector('.my-6');

        expect(layout).toBeInTheDocument();
    });
});
