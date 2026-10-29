/**
 * @file Header.test.tsx
 * @description Unit tests for orderHistory Header component
 * Verifies:
 *  - Renders the Order History title
 *  - Renders DatePicker and search input
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Header from '../../../components/orderHistory/Header';

const defaultProps = {
    handleFilterChange: vi.fn(),
    handleSearchChange: vi.fn(),
    filter: { from: null, to: '2026-04-21', page: 1, limit: 10 },
    searchInput: '',
};

describe('orderHistory Header', () => {
    it('should render the Order History title', () => {
        render(<Header {...(defaultProps as any)} />);
        expect(screen.getByText('Order History')).toBeInTheDocument();
    });

    it('should render the search input', () => {
        render(<Header {...(defaultProps as any)} />);
        expect(screen.getByPlaceholderText('Search for orders')).toBeInTheDocument();
    });
});
