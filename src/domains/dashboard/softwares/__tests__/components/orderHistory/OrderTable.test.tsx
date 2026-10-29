/**
 * @file OrderTable.test.tsx
 * @description Unit tests for OrderTable component
 * Verifies:
 *  - Renders without crashing with empty data
 *  - Renders column headers
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import OrderTable from '../../../components/orderHistory/OrderTable';

vi.mock('@src/routes/paths', () => ({
    paths: { softwares: { managePlan: '/manage-plan' } },
}));

const defaultProps = {
    isLoading: false,
    orderDetails: [],
    handlePagination: vi.fn(),
    filter: { page: 1, limit: 10, from: null, to: '2026-04-21' },
    total: 0,
};

describe('OrderTable', () => {
    beforeAll(() => {
        window.getComputedStyle = () => new Proxy({} as CSSStyleDeclaration, { get: () => '0px' });
    });
    it('should render without crashing', () => {
        render(
            <MemoryRouter>
                <OrderTable {...(defaultProps as any)} />
            </MemoryRouter>
        );
        expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render column headers', () => {
        render(
            <MemoryRouter>
                <OrderTable {...(defaultProps as any)} />
            </MemoryRouter>
        );
        expect(screen.getByText('Product Name')).toBeInTheDocument();
        expect(screen.getByText('Order ID')).toBeInTheDocument();
        expect(screen.getByText('Payment Status')).toBeInTheDocument();
    });
});
