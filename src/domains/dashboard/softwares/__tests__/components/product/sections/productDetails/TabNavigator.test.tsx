/**
 * @file TabNavigator.test.tsx
 * @description Unit tests for TabNavigator component
 * Verifies:
 *  - Renders skeleton when loading
 *  - Renders tabs when not loading
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TabNavigator from '@src/domains/dashboard/softwares/components/product/sections/productDetails/TabNavigator';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';
import { useProductTabs } from '@src/domains/dashboard/softwares/hooks/product/useProductTabs';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock('@src/domains/dashboard/softwares/hooks/product/useProductTabs', () => ({
    useProductTabs: vi.fn(),
}));
vi.mock(
    '@src/domains/dashboard/softwares/components/common/skeletons/product/ProductTabsSkeleton',
    () => ({
        default: () => <div data-testid="tabs-skeleton" />,
    })
);

describe('TabNavigator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useProductTabs).mockReturnValue({
            tabItems: [{ key: '1', label: 'Overview' }],
            onTabChange: vi.fn(),
        } as any);
    });

    it('should render skeleton when loading', () => {
        vi.mocked(useProductContext).mockReturnValue({ isLoading: true } as any);
        render(<TabNavigator />);
        expect(screen.getByTestId('tabs-skeleton')).toBeInTheDocument();
    });

    it('should render tabs when not loading', () => {
        vi.mocked(useProductContext).mockReturnValue({ isLoading: false } as any);
        render(<TabNavigator />);
        expect(screen.queryByTestId('tabs-skeleton')).not.toBeInTheDocument();
    });
});
