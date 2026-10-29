/**
 * @file Step3.test.tsx
 * @description Unit tests for FindProducts Step3 component
 * Verifies:
 *  - Returns null when no current question
 *  - Renders specialized question heading and question text
 *  - Calls prev/next handlers on button clicks
 */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Step3 from '../../../components/findProducts/Step3';

const mockPrev = vi.fn();
const mockNext = vi.fn();

const categoryQuestion = {
    key: 'cq1',
    question: 'Which CRM features do you need?',
    type: 'singleChoice' as const,
    options: [
        { value: 'leads', label: 'Lead Management' },
        { value: 'analytics', label: 'Analytics' },
    ],
};

const categoryQuestion2 = {
    key: 'cq2',
    question: 'What is your team size?',
    type: 'singleChoice' as const,
    options: [
        { value: 'small', label: 'Small' },
        { value: 'large', label: 'Large' },
    ],
};

const defaultProps = {
    categoryQuestions: [categoryQuestion, categoryQuestion2],
    currentCategoryIndex: 0,
    categoryAnswers: {},
    handleCategoryAnswer: vi.fn(),
    handleCategoryFollowUpAnswer: vi.fn(),
    nextCategoryQuestion: mockNext,
    prevCategoryQuestion: mockPrev,
};

describe('Step3', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when no current question', () => {
        const { container } = render(
            <Step3 {...defaultProps} categoryQuestions={[]} currentCategoryIndex={0} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render specialized question heading', () => {
        render(<Step3 {...defaultProps} />);
        expect(screen.getByText('Specialized question 1 of 2')).toBeInTheDocument();
        expect(screen.getByText('Which CRM features do you need?')).toBeInTheDocument();
    });

    it('should render options', () => {
        render(<Step3 {...defaultProps} />);
        expect(screen.getByText('Lead Management')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should call prevCategoryQuestion on Go Back click', () => {
        render(<Step3 {...defaultProps} />);
        fireEvent.click(screen.getByText('Go Back'));
        expect(mockPrev).toHaveBeenCalledTimes(1);
    });

    it('should call nextCategoryQuestion on Next click', () => {
        render(<Step3 {...defaultProps} />);
        fireEvent.click(screen.getByText('Next'));
        expect(mockNext).toHaveBeenCalledTimes(1);
    });
});
