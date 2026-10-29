/**
 * @file Step4.test.tsx
 * @description Unit tests for FindProducts Step4 (Review) component
 * Verifies:
 *  - Renders Review Your Answers heading
 *  - Renders answers from payload
 *  - Calls onSubmit when Submit is clicked
 *  - Calls prevQuestionFromReview when Go Back is clicked
 */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Step4 from '../../../components/findProducts/Step4';

const mockOnSubmit = vi.fn();
const mockPrev = vi.fn();
const mockBuildPayload = vi.fn(() => ({
    softwareCategory: 'CRM',
    generalQuestions: {
        q1: { question: 'Team size?', answer: ['small'] },
    },
    specializedQuestions: {},
}));

const defaultProps = {
    prevQuestionFromReview: mockPrev,
    buildPayload: mockBuildPayload,
    onSubmit: mockOnSubmit,
    isSubmitting: false,
};

describe('Step4', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the Review Your Answers heading', () => {
        render(<Step4 {...defaultProps} />);
        expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
    });

    it('should call onSubmit when Submit is clicked', () => {
        render(<Step4 {...defaultProps} />);
        fireEvent.click(screen.getByText('Submit'));
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call prevQuestionFromReview when Go Back is clicked', () => {
        render(<Step4 {...defaultProps} />);
        fireEvent.click(screen.getByText('Go Back'));
        expect(mockPrev).toHaveBeenCalledTimes(1);
    });

    it('should render answers from the payload', () => {
        render(<Step4 {...defaultProps} />);
        expect(screen.getByText('Team size?')).toBeInTheDocument();
    });
});
