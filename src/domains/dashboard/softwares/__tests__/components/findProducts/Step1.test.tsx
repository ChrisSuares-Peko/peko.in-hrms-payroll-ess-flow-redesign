/**
 * @file Step1.test.tsx
 * @description Unit tests for FindProducts Step1 component
 * Verifies:
 *  - Renders category selection text
 *  - Renders a radio option for each category
 *  - Calls navigate when Go Back is clicked
 *  - Calls fetchGeneralQ when Next is clicked
 */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Step1 from '../../../components/findProducts/Step1';

vi.mock('@src/routes/paths', () => ({
    paths: { softwares: { index: 'softwares' } },
}));

const mockNavigate = vi.fn();
const mockFetchGeneralQ = vi.fn().mockResolvedValue(undefined);

const defaultProps = {
    selectedCategory: '',
    setSelectedCategory: vi.fn(),
    categoryList: [
        { weburl: 'accounting', name: 'Accounting' },
        { weburl: 'crm', name: 'CRM' },
    ],
    navigate: mockNavigate,
    fetchGeneralQ: mockFetchGeneralQ,
    isLoading: false,
};

describe('Step1', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the category selection heading', () => {
        render(<Step1 {...defaultProps} />);
        expect(screen.getByText('Select a category')).toBeInTheDocument();
    });

    it('should render a radio for each category', () => {
        render(<Step1 {...defaultProps} />);
        expect(screen.getByText('Accounting')).toBeInTheDocument();
        expect(screen.getByText('CRM')).toBeInTheDocument();
    });

    it('should call navigate when Go Back is clicked', () => {
        render(<Step1 {...defaultProps} />);
        fireEvent.click(screen.getByText('Go Back'));
        expect(mockNavigate).toHaveBeenCalledWith('/softwares');
    });

    it('should call fetchGeneralQ when Next is clicked', () => {
        render(<Step1 {...defaultProps} />);
        fireEvent.click(screen.getByText('Next'));
        expect(mockFetchGeneralQ).toHaveBeenCalledTimes(1);
    });
});
