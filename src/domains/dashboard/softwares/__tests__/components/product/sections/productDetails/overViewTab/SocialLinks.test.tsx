/**
 * @file SocialLinks.test.tsx
 * @description Unit tests for SocialLinks component
 * Verifies:
 *  - Renders nothing when no social links
 *  - Renders known social link platforms
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SocialLinks from '@src/domains/dashboard/softwares/components/product/sections/productDetails/overViewTab/SocialLinks';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('SocialLinks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render nothing when no valid social links', () => {
        mockedUseProductContext.mockReturnValue({
            product: { social_links: {} },
        } as any);
        const { container } = render(<SocialLinks />);
        expect(container.firstChild?.childNodes.length).toBe(0);
    });

    it('should render linkedin link when present', () => {
        mockedUseProductContext.mockReturnValue({
            product: {
                social_links: {
                    linkedin: 'https://linkedin.com/company/test',
                },
            },
        } as any);
        render(<SocialLinks />);
        expect(screen.getByText('Linkedin')).toBeInTheDocument();
    });
});
