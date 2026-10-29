import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SignerDetailsForm from '@domains/dashboard/eSign/components/viewPage/SignerDetailsForm';

// Mock Redux store
const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { role: 'user', id: 1 },
        eSignDoc: {
            isDisabled: false,
            signers_info: [
                {
                    signer_name: 'John Doe',
                    signer_email: 'john@example.com',
                    signer_mobile: '1234567890',
                },
                {
                    signer_name: 'Jane Doe',
                    signer_email: 'jane@example.com',
                    signer_mobile: '0987654321',
                },
            ],
            pageNumbers: 2,
            sequentialSignature: false,
            signerCo: [],
        },
    },
});

vi.mock('@domains/dashboard/eSign/slices/eSignDocSlice', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        setRemoveSigner: vi.fn(),
        removeSignerArray: vi.fn(),
    };
});

vi.mock('@domains/dashboard/eSign/slices/eSignDocSlice', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        setRemoveSigner: vi.fn(),
        removeSignerArray: vi.fn(),
    };
});

describe('SignerDetailsForm Component', () => {
    const removeSigner = vi.fn();
    const onExpand = vi.fn();

    beforeEach(() => {
        store.clearActions(); // Clear actions before each test
    });

    const renderComponent = (index = 0, isExpanded = true) =>
        render(
            <Provider store={store}>
                <MemoryRouter>
                    {/* ✅ Wrap in Formik */}
                    <Formik
                        initialValues={{
                            signers_info: [
                                {
                                    signer_name: 'John Doe',
                                    signer_email: 'john@example.com',
                                    signer_mobile: '1234567890',
                                },
                                {
                                    signer_name: 'Jane Doe',
                                    signer_email: 'jane@example.com',
                                    signer_mobile: '0987654321',
                                },
                            ],
                        }}
                        onSubmit={() => {}}
                    >
                        <SignerDetailsForm
                            index={index}
                            removeSigner={removeSigner}
                            isExpanded={isExpanded}
                            onExpand={onExpand}
                        />
                    </Formik>
                </MemoryRouter>
            </Provider>
        );

    it('expands when clicked', () => {
        renderComponent(0, false);

        const expandButton = screen.getByText(/Signer 1/i);
        fireEvent.click(expandButton);
        expect(onExpand).toHaveBeenCalled();
    });

    it('does not call removeSigner for first signer', () => {
        renderComponent(0); // First signer

        const deleteButton = screen.getByRole('img', { name: /delete/i });
        fireEvent.click(deleteButton);

        expect(removeSigner).not.toHaveBeenCalled();
    });
});
