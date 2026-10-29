import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formik } from 'formik'; // Import Formik provider
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import AdditionalDetailsForm from '../../../components/viewPage/AdditionalDetailsForm';

const mockStore = configureStore();

describe('AdditionalDetailsForm Component', () => {
    let store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                eSignDoc: {
                    isDisabled: false,
                    reminder: false,
                },
            },
        });

        store.dispatch = vi.fn();
    });

    const renderWithFormik = (storeState = store) =>
        render(
            <Provider store={storeState}>
                <MemoryRouter>
                    <Formik initialValues={{}} onSubmit={() => {}}>
                        <AdditionalDetailsForm signersLength={1} />
                    </Formik>
                </MemoryRouter>
            </Provider>
        );

    it('renders the form correctly', () => {
        renderWithFormik();

        expect(screen.getByText(/Additional Details:/i)).toBeInTheDocument();

        // Instead of getByLabelText, use getByPlaceholderText or getByRole
        expect(screen.getByPlaceholderText(/Enter initiator name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter initiator email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Select last date to sign/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter notes/i)).toBeInTheDocument();

        expect(screen.getByText(/Enable Automatic reminders/i)).toBeInTheDocument();
    });

    it('shows the reminder input field when the checkbox is checked', async () => {
        renderWithFormik();

        const reminderCheckbox = screen.getByText(/Enable Automatic reminders/i);
        fireEvent.click(reminderCheckbox);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter days/i)).toBeInTheDocument();
        });
    });

    it('does not show the reminder input field when the checkbox is unchecked', async () => {
        renderWithFormik();

        expect(screen.queryByPlaceholderText(/Enter days/i)).not.toBeInTheDocument();
    });

    it('disables all inputs when isDisabled is true', async () => {
        const disabledStore = mockStore({
            reducer: {
                eSignDoc: {
                    isDisabled: true,
                    reminder: false,
                },
            },
        });

        renderWithFormik(disabledStore);

        expect(screen.getByPlaceholderText(/Enter initiator name/i)).toBeDisabled();
        expect(screen.getByPlaceholderText(/Enter initiator email/i)).toBeDisabled();
        expect(screen.getByPlaceholderText(/Select last date to sign/i)).toBeDisabled();
        expect(screen.getByPlaceholderText(/Enter notes/i)).toBeDisabled();
    });
});
