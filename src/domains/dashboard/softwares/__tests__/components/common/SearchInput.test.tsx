/**
 * @file SearchInput.test.tsx
 * @description Unit tests for SearchInput component
 * Verifies:
 *  - Renders with the given value
 *  - Calls onChange when input changes
 *  - Uses placeholder prop
 */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SearchInput from '../../../components/common/SearchInput';

describe('SearchInput', () => {
    it('should render with the given value', () => {
        render(<SearchInput value="hello" onChange={vi.fn()} />);
        expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
    });

    it('should call onChange when input value changes', () => {
        const handleChange = vi.fn();
        render(<SearchInput value="" onChange={handleChange} />);
        const input = screen.getByPlaceholderText('Search');
        fireEvent.change(input, { target: { value: 'new value' } });
        expect(handleChange).toHaveBeenCalled();
    });

    it('should use custom placeholder when provided', () => {
        render(<SearchInput value="" onChange={vi.fn()} placeholder="Find software..." />);
        expect(screen.getByPlaceholderText('Find software...')).toBeInTheDocument();
    });
});
