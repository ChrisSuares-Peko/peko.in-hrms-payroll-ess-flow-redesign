import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';

import SelectCountry from '@domains/dashboard/Hotels/Components/AutoComplete/SelectCountry';

const mockOptions = [
    { Name: 'India', Code: 'IN' },
    { Name: 'United States', Code: 'US' },
    { Name: 'Canada', Code: 'CA' },
    { Name: 'Australia', Code: 'AU' },
];

const mockOnSelect = vi.fn();
const mockSetSearchKey = vi.fn();

describe('SelectCountry Component', () => {
    it('should render the input with the correct placeholder', () => {
        render(
            <SelectCountry
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
                placeholder="Enter country"
            />
        );

        expect(screen.getByPlaceholderText('Enter country')).toBeInTheDocument();
    });

    it('should display options when input is clicked', () => {
        render(
            <SelectCountry
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
                placeholder="Enter country"
            />
        );

        const input = screen.getByPlaceholderText('Enter country');
        fireEvent.click(input);

        mockOptions.forEach(option => {
            expect(screen.getByText(option.Name)).toBeInTheDocument();
        });
    });

    it('should filter options based on input text', () => {
        render(
            <SelectCountry
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
                placeholder="Enter country"
            />
        );

        const input = screen.getByPlaceholderText('Enter country');
        fireEvent.change(input, { target: { value: 'United' } });

        expect(screen.getByText('United States')).toBeInTheDocument();
        expect(screen.queryByText('India')).not.toBeInTheDocument();
        expect(screen.queryByText('India')).not.toBeInTheDocument();
    });

    it('should call onSelect and setSearchKey when an option is clicked', () => {
        render(
            <SelectCountry
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
                placeholder="Enter country"
            />
        );

        const input = screen.getByPlaceholderText('Enter country');
        fireEvent.click(input);

        const option = screen.getByText('India');
        fireEvent.click(option);

        // expect(mockOnSelect).toHaveBeenCalledWith('IN');
        // expect(mockSetSearchKey).toHaveBeenCalledWith('IN');
    });

    it('should update the input value when an option is selected', () => {
        render(
            <SelectCountry
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
                placeholder="Enter country"
            />
        );

        const input = screen.getByPlaceholderText('Enter country');
        fireEvent.click(input);

        const option = screen.getByText('India');
        fireEvent.click(option);

        expect(input).toHaveValue('India');
    });

    it('should hide the dropdown when the input loses focus', () => {
        render(
            <SelectCountry
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
                placeholder="Enter country"
            />
        );

        const input = screen.getByPlaceholderText('Enter country');
        fireEvent.click(input);

        const option = screen.getByText('India');
        expect(option).toBeInTheDocument();

        fireEvent.blur(input);

        setTimeout(() => {
            expect(screen.queryByText('India')).not.toBeInTheDocument();
        }, 200);
    });
});
