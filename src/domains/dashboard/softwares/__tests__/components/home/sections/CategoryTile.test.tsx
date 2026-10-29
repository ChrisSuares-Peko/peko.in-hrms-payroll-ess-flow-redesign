/**
 * @file CategoryTile.test.tsx
 * @description Unit tests for CategoryTile component
 * Verifies:
 *  - Renders category name
 *  - Calls navigateAndUpdateStore with category weburl on click
 */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import CategoryTile from '../../../../components/home/sections/CategoryTile';

vi.mock('../../../../../../assets/icons/Accounting.svg', () => ({ default: 'accounting.svg' }));

const mockNavigate = vi.fn();

const category = { name: 'Accounting', weburl: 'accounting', icon: 'icon.svg' };

describe('CategoryTile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the category name', () => {
        render(
            <CategoryTile
                category={category as any}
                navigateAndUpdateStore={mockNavigate}
                tileIconSize={24}
            />
        );
        expect(screen.getByText('Accounting')).toBeInTheDocument();
    });

    it('should call navigateAndUpdateStore with weburl on click', () => {
        render(
            <CategoryTile
                category={category as any}
                navigateAndUpdateStore={mockNavigate}
                tileIconSize={24}
            />
        );
        fireEvent.click(screen.getByText('Accounting'));
        expect(mockNavigate).toHaveBeenCalledWith('accounting');
    });
});
