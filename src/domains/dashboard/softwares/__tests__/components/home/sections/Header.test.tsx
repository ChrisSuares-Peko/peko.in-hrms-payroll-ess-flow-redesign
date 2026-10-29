/**
 * @file Header.test.tsx
 * @description Unit tests for home Header component
 * Verifies:
 *  - Renders the Softwares title
 *  - Renders the Order History link button
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import Header from '../../../../components/home/sections/Header';

vi.mock('@src/routes/paths', () => ({
    paths: { softwares: { orderHistory: '/order-history' } },
}));

describe('home Header', () => {
    it('should render the Softwares title', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );
        expect(screen.getByText('Softwares')).toBeInTheDocument();
    });

    it('should render the Order History button', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );
        expect(screen.getByText('Order History')).toBeInTheDocument();
    });
});
