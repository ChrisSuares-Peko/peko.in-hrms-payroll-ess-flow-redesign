import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import TableHeader from '../../../components/orderHistory/TableHeader';

describe('TableHeader Component', () => {
    it('renders the component correctly', () => {
        render(
            <TableHeader
                setSearchText={vi.fn()}
                searchText=""
                from=""
                to=""
                handleDateChange={vi.fn()}
                handleFromChange={vi.fn()}
                handleToChange={vi.fn()}
            />
        );

        expect(screen.getByText('eSign Status')).toBeInTheDocument();

        expect(screen.getByPlaceholderText('Search document name')).toBeInTheDocument();
    });

    it('calls setSearchText when input value changes', () => {
        const mockSetSearchText = vi.fn();
        render(
            <TableHeader
                setSearchText={vi.fn()}
                searchText=""
                from=""
                to=""
                handleDateChange={vi.fn()}
                handleFromChange={vi.fn()}
                handleToChange={vi.fn()}
            />
        );

        const input = screen.getByPlaceholderText('Search document name');

        fireEvent.change(input, { target: { value: 'Test Document' } });

        expect(mockSetSearchText).toHaveBeenCalledWith('Test Document');
    });

    it('clears search text when allowClear is clicked', () => {
        const mockSetSearchText = vi.fn();
        render(
            <TableHeader
                setSearchText={vi.fn()}
                searchText=""
                from=""
                to=""
                handleDateChange={vi.fn()}
                handleFromChange={vi.fn()}
                handleToChange={vi.fn()}
            />
        );

        const input = screen.getByPlaceholderText('Search document name');

        expect(input).toHaveValue('Initial Text');

        fireEvent.change(input, { target: { value: '' } });

        expect(mockSetSearchText).toHaveBeenCalledWith('');
    });
});
