/**
 * @file SubscriptionPlan.test.tsx
 * @module SubscriptionPlanPageTests
 * @description
 * Unit tests for the SubscriptionPlan page component.
 *
 * This suite validates the structural responsibilities of the page,
 * ensuring correct UI composition, proper context provider integration,
 * and expected layout styling.
 *
 * @remarks
 * - Child components are mocked to isolate page-level behavior.
 * - The context provider is mocked using a DOM wrapper to validate
 *   structural composition instead of implementation details.
 * - Internal logic of child components and context is intentionally
 *   excluded and should be tested in their respective units.
 *
 * @coverage
 * - Verifies rendering of:
 *   - Description component
 *   - Plans component
 * - Ensures the component tree is wrapped with SubscriptionContextProvider
 * - Validates layout classes for:
 *   - Content container ("my-6")
 *   - Flex container ("items-center pt-16 gap-10")
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SubscriptionPlan from '../../pages/SubscriptionPlan';

/**
 * @mock ../../components/subscriptionPlans
 * @description
 * Mocks child UI components to isolate the SubscriptionPlan page.
 * Each component renders a simple identifiable element to enable
 * stable and reliable DOM assertions.
 */
vi.mock('../../components/subscriptionPlans', () => ({
    Description: () => <div data-testid="description">Description</div>,
    Plans: () => <div data-testid="plans">Plans</div>,
}));

/**
 * @mock ../../contexts/SubscriptionPageContext
 * @description
 * Mocks SubscriptionContextProvider to verify that the page correctly
 * wraps its children without relying on actual context implementation.
 *
 * The mocked provider renders children inside a container element
 * identified by a test id for structural assertions.
 */
vi.mock('../../contexts/SubscriptionPageContext', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="provider">{children}</div>
    ),
}));

/**
 * @suite SubscriptionPlan Page
 * @description
 * Validates UI composition, provider integration, and layout structure
 * of the SubscriptionPlan page component.
 */
describe('SubscriptionPlan Page', () => {
    /**
     * @hook beforeEach
     * @description
     * Clears all mock states before each test to ensure isolation
     * and prevent cross-test interference.
     */
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test
     * @name should render all sections
     * @description
     * Ensures that all primary UI sections are rendered within the page.
     *
     * @expect
     * - Description component is present in the DOM
     * - Plans component is present in the DOM
     */
    it('should render all sections', () => {
        render(<SubscriptionPlan />);

        expect(screen.getByTestId('description')).toBeInTheDocument();
        expect(screen.getByTestId('plans')).toBeInTheDocument();
    });

    /**
     * @test
     * @name should wrap content with SubscriptionContextProvider
     * @description
     * Ensures that the page content is wrapped with the
     * SubscriptionContextProvider, validating correct context integration.
     *
     * @expect
     * - Provider container exists in the DOM
     * - Description and Plans components are rendered within the provider
     */
    it('should wrap content with SubscriptionContextProvider', () => {
        render(<SubscriptionPlan />);

        const provider = screen.getByTestId('provider');

        expect(provider).toBeInTheDocument();
        expect(provider).toContainElement(screen.getByTestId('description'));
        expect(provider).toContainElement(screen.getByTestId('plans'));
    });

    /**
     * @test
     * @name should apply correct layout classes
     * @description
     * Validates that layout containers apply the expected utility classes
     * for spacing and alignment.
     *
     * @expect
     * - Content container has class "my-6"
     * - Flex container has classes "items-center pt-16 gap-10"
     */
    it('should apply correct layout classes', () => {
        const { container } = render(<SubscriptionPlan />);

        const content = container.querySelector('.my-6');
        const flex = container.querySelector('.items-center.pt-16.gap-10');

        expect(content).toBeInTheDocument();
        expect(flex).toBeInTheDocument();
    });
});
