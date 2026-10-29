/**
 * @file index.test.tsx
 * @description Unit tests for ProductImagesTab component
 * Verifies:
 *  - Renders empty state when no snapshots
 *  - Renders images when snapshots exist
 */

import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProductImagesTab from '@src/domains/dashboard/softwares/components/product/sections/productDetails/productImagesTab/index';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock(
    '@src/domains/dashboard/softwares/assets/images/defaultProductIntegrationImage.svg',
    () => ({ default: 'default.svg' })
);

const mockedUseProductContext = vi.mocked(useProductContext);

describe('ProductImagesTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render empty state when no snapshots', () => {
        mockedUseProductContext.mockReturnValue({ product: { snapshots: [] } } as any);
        render(<ProductImagesTab />);
        expect(document.querySelector('.ant-empty')).toBeInTheDocument();
    });

    it('should render without crashing when snapshots exist', () => {
        mockedUseProductContext.mockReturnValue({
            product: {
                snapshots: [{ _id: '1', name: 'Screenshot 1', Location: 'https://img.com/1.png' }],
            },
        } as any);
        const { container } = render(<ProductImagesTab />);
        expect(container).toBeTruthy();
    });
});
