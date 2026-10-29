/**
 * @file Hero.test.tsx
 * @description Unit tests for home Hero component
 * Verifies:
 *  - Renders the main headline
 *  - Renders the search input
 *  - Renders the Click Here link
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import Hero from '../../../../components/home/sections/Hero';

vi.mock('@src/routes/paths', () => ({
    paths: { softwares: { findSoftware: '/find-software' } },
}));

vi.mock('../../../../hooks/home/useSearch', () => ({
    default: () => ({
        searchText: '',
        handleSearch: vi.fn(),
        getSearchResults: vi.fn(),
    }),
}));

describe('home Hero', () => {
    it('should render the main headline', () => {
        render(
            <MemoryRouter>
                <Hero />
            </MemoryRouter>
        );
        expect(screen.getByText('Find The Right Software For Your Business')).toBeInTheDocument();
    });

    it('should render the search input', () => {
        render(
            <MemoryRouter>
                <Hero />
            </MemoryRouter>
        );
        expect(screen.getByPlaceholderText('Search for software...')).toBeInTheDocument();
    });

    it('should render Click Here link', () => {
        render(
            <MemoryRouter>
                <Hero />
            </MemoryRouter>
        );
        expect(screen.getByText('Click Here')).toBeInTheDocument();
    });
});
