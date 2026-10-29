/**
 * @file GetAssistanceSuccess.test.tsx
 * @module GetAssistanceSuccessPageTests
 * @description
 * Comprehensive unit tests for the GetAssistanceSuccess page component.
 *
 * This suite validates UI rendering, dynamic content, step-based information,
 * layout structure, and user interaction (navigation).
 *
 * @remarks
 * - External dependencies such as Lottie and react-router are mocked.
 * - Tests focus on UI correctness and interaction behavior.
 *
 * @coverage
 * - Verifies rendering of:
 *   - Success title and subtitle
 *   - Animation (Lottie)
 *   - Steps section (titles + descriptions)
 *   - Help section content
 * - Validates dynamic content (weburl interpolation)
 * - Ensures correct navigation on button click
 * - Verifies layout classes
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { paths } from '@src/routes/paths';

import GetAssistanceSuccess from '../../pages/GetAssistanceSuccess';

/**
 * =========================================================
 * MOCK: react-router
 * =========================================================
 */
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

/**
 * =========================================================
 * MOCK: Lottie
 * =========================================================
 */
vi.mock('react-lottie', () => ({
    default: () => <div data-testid="lottie-animation" />,
}));

/**
 * =========================================================
 * TEST SUITE
 * =========================================================
 */
describe('GetAssistanceSuccess Page', () => {
    /**
     * Reset mocks before each test
     */
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test
     * @name should render success title and subtitle
     * @description
     * Verifies that the main success message is displayed.
     */
    it('should render success title and subtitle', () => {
        render(<GetAssistanceSuccess />);

        expect(screen.getByText(/Thank You for Your Interest/i)).toBeInTheDocument();

        expect(screen.getByText(/We've received your information/i)).toBeInTheDocument();
    });

    /**
     * @test
     * @name should render success animation
     * @description
     * Ensures that the Lottie animation is rendered.
     */
    it('should render success animation', () => {
        render(<GetAssistanceSuccess />);
        expect(screen.getByTestId('lottie-animation')).toBeInTheDocument();
    });

    /**
     * @test
     * @name should render steps section with titles
     * @description
     * Verifies that all step titles are displayed correctly.
     */
    it('should render steps section with titles', () => {
        render(<GetAssistanceSuccess />);

        expect(screen.getByText(/What's Next/i)).toBeInTheDocument();

        expect(screen.getByText(/Personal consultation/i)).toBeInTheDocument();
        expect(screen.getByText(/Customized proposal/i)).toBeInTheDocument();
        expect(screen.getByText(/Quick onboarding/i)).toBeInTheDocument();
    });

    /**
     * @test
     * @name should render step descriptions
     * @description
     * Ensures that all step descriptions are displayed.
     */
    it('should render step descriptions', () => {
        render(<GetAssistanceSuccess />);

        expect(screen.getByText(/Our specialist will call you/i)).toBeInTheDocument();

        expect(screen.getByText(/Receive a tailored plan/i)).toBeInTheDocument();

        expect(screen.getByText(/Get started with your new/i)).toBeInTheDocument();
    });

    /**
     * @test
     * @name should render dynamic weburl content
     * @description
     * Verifies that the dynamic weburl ("Salesforce") is correctly
     * interpolated into UI text.
     */
    it('should render dynamic weburl content', () => {
        render(<GetAssistanceSuccess />);

        expect(screen.getByText(/Salesforce subscription/i)).toBeInTheDocument();

        expect(screen.getByText(/help you get started with Salesforce/i)).toBeInTheDocument();
    });

    /**
     * @test
     * @name should render help section
     * @description
     * Verifies the help section UI content.
     */
    it('should render help section', () => {
        render(<GetAssistanceSuccess />);

        expect(screen.getByText(/Need Help/i)).toBeInTheDocument();
        expect(screen.getByText(/Our support team is here/i)).toBeInTheDocument();
    });

    /**
     * @test
     * @name should navigate to support page on button click
     * @description
     * Ensures that clicking the "Contact Support" button
     * triggers navigation to the correct route.
     */
    it('should navigate to support page on button click', () => {
        render(<GetAssistanceSuccess />);

        fireEvent.click(screen.getByRole('button', { name: /Contact Support/i }));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.needHelp);
    });

    /**
     * @test
     * @name should apply correct layout classes
     * @description
     * Validates that the root layout container applies the expected
     * utility classes for spacing and alignment.
     */
    it('should apply correct layout classes', () => {
        const { container } = render(<GetAssistanceSuccess />);

        const layout = container.querySelector(
            '.min-h-screen.items-start.justify-center.px-6.pt-8'
        );

        expect(layout).toBeInTheDocument();
    });

    /**
     * @test
     * @name should render exactly three steps
     * @description
     * Ensures that the steps section contains exactly three items.
     */
    it('should render exactly three steps', () => {
        render(<GetAssistanceSuccess />);

        const steps = screen.getAllByText(
            /Personal consultation|Customized proposal|Quick onboarding/i
        );

        expect(steps.length).toBe(3);
    });
});
