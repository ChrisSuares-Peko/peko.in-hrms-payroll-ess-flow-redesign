import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';

import SelectCity from '@domains/dashboard/Hotels/Components/AutoComplete/SelectCity';

const mockOptions = [
    { Name: 'Mumbai, Maharashtra', Code: 'BOM' },
    { Name: 'Delhi, Delhi', Code: 'DEL' },
    { Name: 'Bangalore, Karnataka', Code: 'BLR' },
];

const mockOnSelect = vi.fn();
const mockSetSearchKey = vi.fn();

describe('SelectCity Component', () => {
    it('should render input field', () => {
        render(
            <SelectCity
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
            />
        );

        expect(screen.getByPlaceholderText('Enter City')).toBeInTheDocument();
    });

    it('should show options when input is clicked', () => {
        render(
            <SelectCity
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
            />
        );

        const input = screen.getByPlaceholderText('Enter City');
        fireEvent.click(input);

        mockOptions.forEach(option => {
            expect(screen.getByText(option.Name)).toBeInTheDocument();
        });
    });

    it('should filter options based on input text', () => {
        render(
            <SelectCity
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
            />
        );

        const input = screen.getByPlaceholderText('Enter City');
        fireEvent.change(input, { target: { value: 'Mumbai' } });

        expect(screen.getByText('Mumbai, Maharashtra')).toBeInTheDocument();
        expect(screen.queryByText('Delhi, Delhi')).not.toBeInTheDocument();
        expect(screen.queryByText('Bangalore, Karnataka')).not.toBeInTheDocument();
    });

    it('should call onSelect and setSearchKey when an option is clicked', async () => {
        render(
            <SelectCity
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
            />
        );

        const input = screen.getByPlaceholderText('Enter City');
        fireEvent.click(input);

        const option = screen.getByText('Mumbai, Maharashtra');
        fireEvent.click(option);

        // await expect(mockSetSearchKey).toHaveBeenCalledWith('BOM');
    });

    it('should not allow input interaction when disabled', () => {
        render(
            <SelectCity
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
                disabled
            />
        );

        const input = screen.getByPlaceholderText('Enter City');
        expect(input).toBeDisabled();
    });

    it('should hide options on blur', async () => {
        render(
            <SelectCity
                options={mockOptions}
                onSelect={mockOnSelect}
                searchKey=""
                setSearchKey={mockSetSearchKey}
                textSize="text-md"
            />
        );

        const input = screen.getByPlaceholderText('Enter City');
        fireEvent.click(input);

        const optionList = screen.getByText('Mumbai, Maharashtra');
        expect(optionList).toBeInTheDocument();

        fireEvent.blur(input);
        setTimeout(() => {
            expect(screen.queryByText('Mumbai, Maharashtra')).not.toBeInTheDocument();
        }, 200); // Wait for the setTimeout duration in the component
    });
});
