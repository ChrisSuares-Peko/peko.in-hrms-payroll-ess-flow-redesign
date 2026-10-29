import { render, screen, fireEvent } from '@testing-library/react';
import { Formik, Form } from 'formik';
import { describe, vi, it, expect } from 'vitest';

import CustomSelect from '../../../pages/paymentLinks/CustomSelect'; // Adjust the import as necessary

const mockTableData = [
    { value: '1', label: 'Customer One', email: 'one@example.com', mobileNo: '1234567890' },
    { value: '2', label: 'Customer Two', email: 'two@example.com', mobileNo: '0987654321' },
];

// Transforming the mock data into the structure used by CustomSelect
const customerOptions = mockTableData.map(customer => ({
    value: customer.value,
    label: customer.label,
    email: customer.email,
    mobileNo: customer.mobileNo,
}));

describe('CustomSelect', () => {
    const mockOnAddOptionClick = vi.fn();

    const setup = (props = {}) => {
        render(
            <Formik initialValues={{ testField: '' }} onSubmit={() => {}}>
                <Form>
                    <CustomSelect label="Test Label" options={customerOptions} {...props} />
                </Form>
            </Formik>
        );
    };

    it('should render with correct label', () => {
        setup({ label: 'Test Label' });
        expect(screen.getAllByText('Test Label').length).toBeGreaterThan(1);
    });

    it('should open and close the dropdown when the select button is clicked', () => {
        setup({ showSearch: true });

        // Click the label to open the dropdown
        const select = screen.getByRole('combobox');
        expect(select).toHaveAttribute('aria-expanded', 'false');
        fireEvent.mouseDown(select); // Open the dropdown
        screen.debug();
        expect(select).toHaveAttribute('aria-expanded', 'true');
    });

    it('should show options when dropdown is opened by clicking the label', () => {
        setup({ showSearch: true });
        const label = screen.getAllByText('Test Label');
        fireEvent.mouseDown(label[1]); // Open the dropdown
        expect(screen.getByText('Customer One')).toBeInTheDocument();
        expect(screen.getByText('Customer Two')).toBeInTheDocument();
    });

    it('should show "Add Customer" option when showAddOption is true', () => {
        setup({
            showAddOption: true,
            onAddOptionClick: mockOnAddOptionClick,
        });
        const label = screen.getAllByText('Test Label');
        fireEvent.mouseDown(label[1]); // Open the dropdown
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
    });

    it('should NOT show "Add Customer" option when showAddOption is false', () => {
        setup({
            showAddOption: false,
            onAddOptionClick: mockOnAddOptionClick,
        });
        const label = screen.getAllByText('Test Label');
        fireEvent.mouseDown(label[1]);
        expect(screen.queryByText('Add Customer')).not.toBeInTheDocument();
    });

    it('should trigger onAddOptionClick when "Add Customer" is clicked', () => {
        setup({
            showAddOption: true,
            onAddOptionClick: mockOnAddOptionClick,
        });
        const label = screen.getAllByText('Test Label');
        fireEvent.mouseDown(label[1]);
        fireEvent.click(screen.getByText('Add Customer'));
        expect(mockOnAddOptionClick).toHaveBeenCalled();
    });
});
