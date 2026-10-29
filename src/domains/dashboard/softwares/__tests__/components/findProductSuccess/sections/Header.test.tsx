/**
 * @file Header.test.tsx
 * @description Unit tests for findProductSuccess Header component
 * Verifies:
 *  - Renders the recommendation heading
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Header from '../../../../components/findProductSuccess/sections/Header';

describe('findProductSuccess Header', () => {
    it('should render the recommendation heading', () => {
        render(<Header />);
        expect(screen.getByText('Best Recommandations For You')).toBeInTheDocument();
    });
});
