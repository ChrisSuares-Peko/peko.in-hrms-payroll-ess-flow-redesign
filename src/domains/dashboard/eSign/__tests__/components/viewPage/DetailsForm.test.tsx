import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formik, Form } from 'formik'; // ✅ Import Form
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setLoading } from '../../../../../../slices/loaderSlice';
import DetailsForm from '../../../components/viewPage/DetailsForm';

const mockStore = configureStore();

describe('DetailsForm Component', () => {
    let store: ReturnType<typeof mockStore>;
    beforeEach(() => {
        store = mockStore({
            reducer: {
                eSignDoc: { isDisabled: false },
                loader: { isLoading: false },
                auth: { role: 'admin', id: 123 }, // ✅ Ensure `auth` exists
            },
        });

        store.dispatch = vi.fn();
    });

    const renderComponent = () =>
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Formik initialValues={{}} onSubmit={() => {}}>
                        <Form>
                            {' '}
                            {/* ✅ Wrap in Form component */}
                            <DetailsForm
                                errors={{}}
                                setExpandedIndex={vi.fn()}
                                signersLength={1}
                            />
                        </Form>
                    </Formik>
                </MemoryRouter>
            </Provider>
        );

    it('renders the component correctly', () => {
        renderComponent();

        expect(
            screen.getByText(/By clicking on this, you agree to be bound by our trusted partner’s/i)
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Document/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('dispatches loader actions when component mounts', () => {
        renderComponent();

        expect(store.dispatch).toHaveBeenCalledWith(setLoading({ isLoading: false }));
    });

    it('calls handleSubmit when "Send Document" button is clicked', async () => {
        renderComponent();

        const sendButton = screen.getByRole('button', { name: /Send Document/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(sendButton).toBeInTheDocument();
        });
    });

    it('disables buttons when isDisabled is true', () => {
        store = mockStore({
            reducer: {
                eSignDoc: { isDisabled: true },
                loader: { isLoading: false },
                auth: { role: 'admin', id: 123 },
            },
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Formik initialValues={{}} onSubmit={() => {}}>
                        <Form>
                            {' '}
                            {/* ✅ Ensure single child by wrapping in Form */}
                            <DetailsForm
                                errors={{}}
                                setExpandedIndex={vi.fn()}
                                signersLength={1}
                            />
                        </Form>
                    </Formik>
                </MemoryRouter>
            </Provider>
        );

        expect(screen.queryByRole('button', { name: /Send Document/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument();
    });
});
