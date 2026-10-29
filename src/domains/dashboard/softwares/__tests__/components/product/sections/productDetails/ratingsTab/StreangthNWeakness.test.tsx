/**
 * @file StreangthNWeakness.test.tsx
 * @description Unit tests for StrengthNWeakness component
 * Verifies:
 *  - Returns null when list is empty
 *  - Renders Strengths heading for strength indicator
 *  - Renders Weaknesses heading for weakness indicator
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import StrengthNWeakness from '@src/domains/dashboard/softwares/components/product/sections/productDetails/ratingsTab/StreangthNWeakness';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('StrengthNWeakness', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when strengths list is empty', () => {
        mockedUseProductContext.mockReturnValue({
            product: { reviews_strengths: [], reviews_weakness: [] },
        } as any);
        const { container } = render(<StrengthNWeakness title="strength" />);
        expect(container.firstChild).toBeNull();
    });

    it('should render Strengths heading when strengths exist', () => {
        mockedUseProductContext.mockReturnValue({
            product: {
                reviews_strengths: ['Easy to use', 'Fast'],
                reviews_weakness: [],
            },
        } as any);
        render(<StrengthNWeakness title="strength" />);
        expect(screen.getByText('Strengths')).toBeInTheDocument();
        expect(screen.getByText('Easy to use')).toBeInTheDocument();
    });

    it('should render Weaknesses heading when weaknesses exist', () => {
        mockedUseProductContext.mockReturnValue({
            product: {
                reviews_strengths: [],
                reviews_weakness: ['Expensive'],
            },
        } as any);
        render(<StrengthNWeakness title="weakness" />);
        expect(screen.getByText('Weaknesses')).toBeInTheDocument();
        expect(screen.getByText('Expensive')).toBeInTheDocument();
    });
});
