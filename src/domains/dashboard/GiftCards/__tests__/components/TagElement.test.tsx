import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TagElement from '../../components/TagElement';

describe('TagElement Component', () => {
    const mockSetCategory = vi.fn();
    const mockSetSearchText = vi.fn();
    const mockSetCurrentPage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders input and select dropdown correctly', () => {
        render(
            <TagElement
                count={5}
                category="Food"
                setCategory={mockSetCategory}
                searchText=""
                setSearchText={mockSetSearchText}
                setCurrentPage={mockSetCurrentPage}
            />
        );

        // Check for search input
        expect(screen.getByPlaceholderText('Search for gift cards')).toBeInTheDocument();

        // Check for select dropdown
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('updates search input value when user types', () => {
        render(
            <TagElement
                count={5}
                category="Food"
                setCategory={mockSetCategory}
                searchText=""
                setSearchText={mockSetSearchText}
                setCurrentPage={mockSetCurrentPage}
            />
        );

        const input = screen.getByPlaceholderText('Search for gift cards');

        fireEvent.change(input, { target: { value: 'Amazon' } });

        expect(mockSetSearchText).toHaveBeenCalledWith('Amazon');
    });

    it('clears input when clicking the clear button', () => {
        render(
            <TagElement
                count={5}
                category="Food"
                setCategory={mockSetCategory}
                searchText="Amazon"
                setSearchText={mockSetSearchText}
                setCurrentPage={mockSetCurrentPage}
            />
        );

        const input = screen.getByPlaceholderText('Search for gift cards');

        fireEvent.change(input, { target: { value: '' } });

        expect(mockSetSearchText).toHaveBeenCalledWith('');
    });

    it('displays default category correctly', async () => {
        render(
            <TagElement
                count={5}
                category="Entertainment"
                setCategory={mockSetCategory}
                searchText=""
                setSearchText={mockSetSearchText}
                setCurrentPage={mockSetCurrentPage}
            />
        );

        const select = screen.getByRole('combobox');

        // Get the selected option inside the dropdown
        fireEvent.mouseDown(select);

        expect(await screen.findByText('Entertainment')).toBeInTheDocument();
    });
});
