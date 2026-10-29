/**
 * @file Tiles.test.tsx
 * @description Unit tests for Tiles component
 * Verifies:
 *  - Renders the title text
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Tiles from '@src/domains/dashboard/softwares/components/product/sections/productDetails/overViewTab/Tiles';

describe('Tiles', () => {
    it('should render the title', () => {
        render(<Tiles title="English" />);
        expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should render different titles', () => {
        render(<Tiles title="Arabic" />);
        expect(screen.getByText('Arabic')).toBeInTheDocument();
    });
});
