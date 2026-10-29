/**
 * @file Home.test.tsx
 * @description Unit test for HomePage component
 * Verifies:
 *  - Rendering of all child sections
 *  - Execution of side-effect hooks
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import HomePage from '../../pages/Home';

/**
 * @mock Child components
 * Replaces actual UI components with simple placeholders
 * to isolate HomePage behavior
 */
vi.mock('@src/domains/dashboard/softwares/components/home', () => ({
    Header: () => <div>Header</div>,
    Hero: () => <div>Hero</div>,
    Categories: () => <div>Categories</div>,
    PopularProducts: () => <div>PopularProducts</div>,
}));

/**
 * @mock Hooks
 * Converts hooks into spies to verify execution
 */
const mockResetQueryParams = vi.fn();
const mockResetRecommendedProducts = vi.fn();

vi.mock('../../hooks/general/useResetQueryParams', () => ({
    default: () => mockResetQueryParams(),
}));

vi.mock('../../hooks/general/useResetRecommendedProducts', () => ({
    default: () => mockResetRecommendedProducts(),
}));

/**
 * @suite HomePage Component
 * @description Tests rendering and side-effects of HomePage
 */
describe('HomePage', () => {
    /**
     * Reset all mocks before each test
     */
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test
     * @description
     * Should:
     *  - Render all homepage sections
     *  - Execute initialization hooks exactly once
     */
    it('should render all sections and call hooks', () => {
        render(<HomePage />);

        /**
         * @assert UI rendering
         */
        expect(screen.getByText('Header')).toBeInTheDocument();
        expect(screen.getByText('Hero')).toBeInTheDocument();
        expect(screen.getByText('Categories')).toBeInTheDocument();
        expect(screen.getByText('PopularProducts')).toBeInTheDocument();

        /**
         * @assert Hook execution
         */
        expect(mockResetQueryParams).toHaveBeenCalledTimes(1);
        expect(mockResetRecommendedProducts).toHaveBeenCalledTimes(1);
    });
});
