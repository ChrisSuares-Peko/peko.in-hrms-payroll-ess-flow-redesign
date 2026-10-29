/**
 * @file SearchResults.test.tsx
 * @module SoftwareFinderPageTests
 * @description
 * Comprehensive unit tests for the SoftwareFinder page component.
 *
 * This suite validates state-driven UI rendering based on the `useFindProduct` hook,
 * ensuring correct step navigation, conditional rendering, loading behavior,
 * and overall page structure.
 *
 * @remarks
 * - Business logic is mocked via `useFindProduct`.
 * - UI subcomponents (Step1–Step4) are mocked to isolate behavior.
 * - Redux and external dependencies are mocked for full isolation.
 *
 * @coverage
 * - Step-based rendering (Step1 → Step4)
 * - Conditional rendering when submitting
 * - Loading overlay and messaging
 * - Static UI elements (title)
 * - Edge cases (invalid step)
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SoftwareFinder from '../../pages/FindProduct';

/**
 * =========================================================
 * MOCK: useFindProduct Hook
 * =========================================================
 *
 * Controls all UI state deterministically for testing.
 */
const mockFinder = {
    step: 1,
    isSubmitting: false,
    selectedCategory: null,
    categoryList: [],
    navigate: vi.fn(),
    fetchGeneralQ: vi.fn(),
    isLoading: false,
    generalQuestions: [],
    currentGeneralIndex: 0,
    generalAnswers: [],
    handleGeneralAnswer: vi.fn(),
    handleGeneralFollowUpAnswer: vi.fn(),
    nextGeneralQuestion: vi.fn(),
    prevGeneralQuestion: vi.fn(),
    categoryQuestions: [],
    currentCategoryIndex: 0,
    categoryAnswers: [],
    handleCategoryAnswer: vi.fn(),
    handleCategoryFollowUpAnswer: vi.fn(),
    nextCategoryQuestion: vi.fn(),
    prevCategoryQuestion: vi.fn(),
    prevQuestionFromReview: vi.fn(),
    buildPayload: vi.fn(),
    handleSubmit: vi.fn(),
    handleCategoryChange: vi.fn(),
};

/**
 * =========================================================
 * GLOBAL MOCKS
 * =========================================================
 */

/** Redux mocks */
vi.mock('react-redux', () => ({
    useDispatch: () => vi.fn(),
    useSelector: () => vi.fn(),
}));

/** App store hooks */
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        reducer: {
            software: {
                rfp: {},
                auth: { role: 'admin', id: 1 },
            },
        },
    })),
    useAppDispatch: () => vi.fn(),
}));

/** Screen size hook */
vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ xs: false }),
}));

/** Business logic hook */
vi.mock('../../hooks/rfp/useFindProduct', () => ({
    default: () => mockFinder,
}));

/** Lottie animation - canvas not available in jsdom */
vi.mock('react-lottie', () => ({
    default: () => <div data-testid="lottie-animation" />,
}));

/**
 * =========================================================
 * MOCK STEP COMPONENTS
 * =========================================================
 */
vi.mock('../../components/findProducts/Step1', () => ({
    default: () => <div data-testid="step1">Step1</div>,
}));
vi.mock('../../components/findProducts/Step2', () => ({
    default: () => <div data-testid="step2">Step2</div>,
}));
vi.mock('../../components/findProducts/Step3', () => ({
    default: () => <div data-testid="step3">Step3</div>,
}));
vi.mock('../../components/findProducts/Step4', () => ({
    default: () => <div data-testid="step4">Step4</div>,
}));

/**
 * =========================================================
 * HELPER: Render Component
 * =========================================================
 */
const renderComponent = () =>
    render(
        <MemoryRouter>
            <SoftwareFinder />
        </MemoryRouter>
    );

/**
 * =========================================================
 * TEST SUITE
 * =========================================================
 */
describe('SoftwareFinder Page', () => {
    /**
     * Reset mock state before each test
     */
    beforeEach(() => {
        vi.clearAllMocks();
        mockFinder.step = 1;
        mockFinder.isSubmitting = false;
    });

    /**
     * @test Step rendering (1–4)
     */
    it('should render Step1 when step = 1', () => {
        mockFinder.step = 1;
        renderComponent();
        expect(screen.getByTestId('step1')).toBeInTheDocument();
    });

    it('should render Step2 when step = 2', () => {
        mockFinder.step = 2;
        renderComponent();
        expect(screen.getByTestId('step2')).toBeInTheDocument();
    });

    it('should render Step3 when step = 3', () => {
        mockFinder.step = 3;
        renderComponent();
        expect(screen.getByTestId('step3')).toBeInTheDocument();
    });

    it('should render Step4 when step = 4', () => {
        mockFinder.step = 4;
        renderComponent();
        expect(screen.getByTestId('step4')).toBeInTheDocument();
    });

    /**
     * @test Negative condition
     */
    it('should NOT render steps when submitting', () => {
        mockFinder.step = 1;
        mockFinder.isSubmitting = true;

        renderComponent();

        expect(screen.queryByTestId('step1')).not.toBeInTheDocument();
    });

    /**
     * @test Loading overlay
     */
    it('should display loading overlay when submitting', () => {
        mockFinder.isSubmitting = true;
        renderComponent();

        expect(screen.getByText(/Fetching recommendations/i)).toBeInTheDocument();
    });

    /**
     * @test Static UI
     */
    it('should render main title', () => {
        renderComponent();

        expect(screen.getByText(/Let Us Help You Find The Right Software/i)).toBeInTheDocument();
    });

    /**
     * @test Edge case
     */
    it('should not render any step for invalid step', () => {
        mockFinder.step = 999;
        renderComponent();

        expect(screen.queryByTestId('step1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('step2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('step3')).not.toBeInTheDocument();
        expect(screen.queryByTestId('step4')).not.toBeInTheDocument();
    });
});
