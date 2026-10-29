import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formik, Form } from 'formik';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SignerDetails from '../../../components/viewPage/SignerDetails';
import { addSigner } from '../../../slices/eSignDocSlice';

const mockStore = configureStore();

describe('SignerDetails Component', () => {
    let store: ReturnType<typeof mockStore>;
    // @ts-ignore
    let dispatchMock: jest.Mock;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                auth: { role: 'admin', id: 123 }, // ✅ Mock `auth` to avoid destructure error
                eSignDoc: {
                    isDisabled: false,
                    signers_info: [],
                },
            },
        });

        dispatchMock = vi.fn();
        store.dispatch = dispatchMock;
    });

    const renderComponent = (signers = []) =>
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Formik initialValues={{ signers_info: signers }} onSubmit={vi.fn()}>
                        {({ values }) => (
                            <Form>
                                <SignerDetails
                                    values={values.signers_info}
                                    expandedIndex={0}
                                    setExpandedIndex={vi.fn()}
                                />
                            </Form>
                        )}
                    </Formik>
                </MemoryRouter>
            </Provider>
        );

    it('renders the component correctly', () => {
        renderComponent();

        expect(screen.getByText(/Add Signers/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Add New Signer/i })).toBeInTheDocument();
    });

    it('adds a new signer when "Add New Signer" button is clicked', async () => {
        renderComponent();

        const addButton = screen.getByRole('button', { name: /Add New Signer/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(dispatchMock).toHaveBeenCalledWith(addSigner());
        });
    });

    it('removes a signer when remove button is clicked', async () => {
        const signers: any = [
            {
                sequence: 1,
                signer_index: 0,
                signer_name: 'John Doe',
                signer_email: 'john@example.com',
            },
        ];

        renderComponent(signers);
        const removeButton = screen.getByLabelText('delete');
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument();
        });
    });

    it('disables adding signers when `isDisabled` is true', () => {
        store = mockStore({
            reducer: {
                eSignDoc: {
                    isDisabled: true,
                    signers_info: [], // ✅ Ensure this is defined
                },
            },
        });

        renderComponent();

        expect(screen.queryByRole('button', { name: /Add New Signer/i })).not.toBeInTheDocument();
    });
});
