/**
 * @file index.test.tsx
 * @description Unit tests for IntegrationsTab component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders empty state when no integrations
 *  - Renders integration names when integrations exist
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import IntegrationsTab from '@src/domains/dashboard/softwares/components/product/sections/productDetails/integrationTab/index';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock(
    '@src/domains/dashboard/softwares/assets/images/defaultProductIntegrationImage.svg',
    () => ({ default: 'integration-default.svg' })
);

const mockedUseProductContext = vi.mocked(useProductContext);

describe('IntegrationsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(
            <MemoryRouter>
                <IntegrationsTab />
            </MemoryRouter>
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render heading when product exists', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: { integrations: [] },
        } as any);
        render(
            <MemoryRouter>
                <IntegrationsTab />
            </MemoryRouter>
        );
        expect(screen.getByText('Available Integration')).toBeInTheDocument();
    });

    it('should render integration names', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                integrations: [{ id: '1', name: 'Slack', logo: '', website: 'https://slack.com' }],
            },
        } as any);
        render(
            <MemoryRouter>
                <IntegrationsTab />
            </MemoryRouter>
        );
        expect(screen.getByText('Slack')).toBeInTheDocument();
    });
});
