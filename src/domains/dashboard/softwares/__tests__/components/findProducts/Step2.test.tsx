/**
 * @file Step2.test.tsx
 * @description Unit tests for FindProducts Step2 component
 * Verifies:
 *  - Returns null when no current question
 *  - Renders general question heading and question text
 *  - Calls prevGeneralQuestion when Go Back is clicked
 */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Step2 from '../../../components/findProducts/Step2';

const mockPrev = vi.fn();
const mockNext = vi.fn();
const mockHandleAnswer = vi.fn();
const mockHandleFollowUp = vi.fn();

const singleChoiceQuestion = {
    key: 'q1',
    question: 'What is your team size?',
    type: 'singleChoice' as const,
    options: [
        { value: 'small', label: '1-10' },
        { value: 'large', label: '100+' },
    ],
};

const defaultProps = {
    generalQuestions: [singleChoiceQuestion],
    currentGeneralIndex: 0,
    generalAnswers: {},
    handleGeneralAnswer: mockHandleAnswer,
    handleGeneralFollowUpAnswer: mockHandleFollowUp,
    nextGeneralQuestion: mockNext,
    prevGeneralQuestion: mockPrev,
    isLoading: false,
};

describe('Step2', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when no current question', () => {
        const { container } = render(
            <Step2 {...defaultProps} generalQuestions={[]} currentGeneralIndex={0} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render question heading and text', () => {
        render(<Step2 {...defaultProps} />);
        expect(screen.getByText('General question 1 of 1')).toBeInTheDocument();
        expect(screen.getByText('What is your team size?')).toBeInTheDocument();
    });

    it('should render options', () => {
        render(<Step2 {...defaultProps} />);
        expect(screen.getByText('1-10')).toBeInTheDocument();
        expect(screen.getByText('100+')).toBeInTheDocument();
    });

    it('should call prevGeneralQuestion on Go Back click', () => {
        render(<Step2 {...defaultProps} />);
        fireEvent.click(screen.getByText('Go Back'));
        expect(mockPrev).toHaveBeenCalledTimes(1);
    });

    it('should call nextGeneralQuestion on Next click', () => {
        render(<Step2 {...defaultProps} />);
        fireEvent.click(screen.getByText('Next'));
        expect(mockNext).toHaveBeenCalledTimes(1);
    });
});
