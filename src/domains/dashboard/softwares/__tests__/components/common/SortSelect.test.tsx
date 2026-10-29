/**
 * @file SortSelect.test.tsx
 * @description Unit tests for SortSelect component
 * Verifies:
 *  - Renders without crashing
 *  - Renders with provided options
 */

import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SortSelect from '../../../components/common/SortSelect';

vi.mock('../../../assets/icons/DownArrow.svg', () => ({ default: 'down-arrow.svg' }));

describe('SortSelect', () => {
    it('should render without crashing', () => {
        const { container } = render(
            <SortSelect value="asc" options={[{ label: 'A-Z', value: 'asc' }]} onChange={vi.fn()} />
        );
        expect(container).toBeTruthy();
    });

    it('should render with empty options', () => {
        const { container } = render(<SortSelect options={[]} onChange={vi.fn()} />);
        expect(container).toBeTruthy();
    });
});
