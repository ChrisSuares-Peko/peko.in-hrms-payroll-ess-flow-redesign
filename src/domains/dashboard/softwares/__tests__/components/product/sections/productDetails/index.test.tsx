/**
 * @file index.test.tsx
 * @description Unit tests for ProductDetails component
 * Verifies:
 *  - Renders Header and TabNavigator child components
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import ProductDetails from '@src/domains/dashboard/softwares/components/product/sections/productDetails/index';

vi.mock(
    '@src/domains/dashboard/softwares/components/product/sections/productDetails/header',
    () => ({ default: () => <div>ProductHeader</div> })
);
vi.mock(
    '@src/domains/dashboard/softwares/components/product/sections/productDetails/TabNavigator',
    () => ({ default: () => <div>TabNavigator</div> })
);

describe('ProductDetails', () => {
    it('should render Header and TabNavigator', () => {
        render(<ProductDetails />);
        expect(screen.getByText('ProductHeader')).toBeInTheDocument();
        expect(screen.getByText('TabNavigator')).toBeInTheDocument();
    });
});
