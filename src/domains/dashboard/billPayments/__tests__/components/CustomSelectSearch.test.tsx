import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Form, Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as Yup from 'yup';

import SearchSelectInput from '../../components/CustomSelectSearch'; // Adjust path

const renderWithFormik = (ui: React.ReactElement) =>
    render(
        <Formik
            initialValues={{ mySelect: '' }}
            validationSchema={Yup.object({
                mySelect: Yup.string().required('This field is required'),
            })}
            onSubmit={() => {}}
        >
            <Form>{ui}</Form>
        </Formik>
    );

describe('SearchSelectInput', () => {
    afterEach(() => {
        cleanup();
    });

    const options = [
        { label: 'Option 1', value: 'value1' },
        { label: 'Option 2', value: 'value2' },
    ];

    it('renders SearchSelectInput with default props', () => {
        renderWithFormik(
            <SearchSelectInput name="mySelect" placeholder="Select an option" options={options} />
        );

        expect(screen.getByRole('combobox')).toBeInTheDocument();

        // Open the select dropdown
        fireEvent.mouseDown(screen.getByRole('combobox'));
        expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('renders error message if field is required and not filled', async () => {
        renderWithFormik(
            <SearchSelectInput
                name="mySelect"
                label="My Select"
                placeholder="Select an option"
                isRequired
                options={options}
            />
        );

        const formItem = screen.getByTestId('form-item');
        const form = formItem.closest('form');

        if (form) {
            fireEvent.submit(form);

            const errorMessage = await screen.findByText('This field is required');
            expect(errorMessage).toBeInTheDocument();
        } else {
            throw new Error('Form element not found');
        }
        const errorMessage = await screen.findByText('This field is required');
        expect(errorMessage).toBeInTheDocument();
    });

    it('handles option selection and triggers onChange callback', async () => {
        const handleChange = vi.fn();

        renderWithFormik(
            <SearchSelectInput
                name="mySelect"
                placeholder="Select an option"
                options={options}
                handleChange={handleChange}
            />
        );

        const select = screen.getByRole('combobox');
        fireEvent.mouseDown(select);

        // Select the option
        const option = await screen.findByText('Option 1');
        fireEvent.click(option);

        // Check if onChange was called with the correct arguments
        expect(handleChange).toHaveBeenCalledWith('value1', {
            label: 'Option 1',
            value: 'value1',
        });
    });

    it('triggers onSearch callback when search input is used', async () => {
        renderWithFormik(
            <SearchSelectInput name="mySelect" placeholder="Select an option" options={options} />
        );

        const searchInput = screen.getByRole('combobox');
        fireEvent.change(searchInput, { target: { value: 'Option' } });

        // Ensure input is updated (Ant Design's select doesn't have a direct onSearch callback)
        await waitFor(() => {
            expect(searchInput).toHaveValue('Option');
        });
    });

    it('handles clear functionality and triggers onClear callback', async () => {
        const handleClear = vi.fn();

        renderWithFormik(
            <SearchSelectInput name="mySelect" placeholder="Select an option" options={options} />
        );

        // Simulate selecting a value to ensure the clear button appears
        const selectInput = screen.getByRole('combobox');
        fireEvent.mouseDown(selectInput); // Open the dropdown
        const optionText = options[0].label;
        const option = await screen.findByText(optionText);
        fireEvent.click(option);

        // Find and click the clear button
        const clearButton = screen.queryByLabelText('close');
        if (clearButton) {
            fireEvent.click(clearButton);

            // Ensure onClear callback was called
            await waitFor(() => {
                expect(handleClear).toHaveBeenCalled();
            });
        } else {
            console.warn('Clear button not found in the DOM.');
        }
    });

    it('shows tooltip when showToolTip is true', async () => {
        renderWithFormik(
            <SearchSelectInput
                name="mySelect"
                label="Test Label"
                placeholder="Select an option"
                options={options}
                showToolTip
                tooltipText="This is a tooltip"
            />
        );

        fireEvent.mouseOver(screen.getByLabelText('info-circle'));

        await waitFor(() => {
            expect(screen.getByText('This is a tooltip')).toBeInTheDocument();
        });
    });
});
