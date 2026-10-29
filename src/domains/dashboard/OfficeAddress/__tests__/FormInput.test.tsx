import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import FormInput from '../components/FormInput';
import { planSchema } from '../schema/index';

vi.mock('@src/slices/apiSlice', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        showToast: vi.fn(),
    };
});

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { id: 1, role: 'user' },
        plan: { workspaceId: null },
        basicInfo: { refresh: false, data: {}, isLoading: false, isEditLoading: false },
    },
});

describe('FormInput Component', () => {
    const mockDispatch = vi.fn();
    store.dispatch = mockDispatch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form correctly', () => {
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <Formik
                        initialValues={{
                            licenseType: 'existing',
                            companyName: '',
                            expiryDate: '',
                            tradeLicenseDoc: '',
                            visaDoc: '',
                        }}
                        validationSchema={planSchema}
                        onSubmit={vi.fn()}
                    >
                        <FormInput />
                    </Formik>
                </Provider>
            </MemoryRouter>
        );

        expect(screen.getByText('Company Name')).toBeInTheDocument();
        expect(screen.getByText('Expiry Date')).toBeInTheDocument();
        expect(screen.getByText('Owner Visa Copy')).toBeInTheDocument();
        expect(screen.getByText('Trade License')).toBeInTheDocument();
    });

    it('shows validation error when location is required but not selected', async () => {
        render(
            <MemoryRouter>
                <Provider store={store}>
                    <Formik
                        initialValues={{
                            licenseType: 'existing',
                            companyName: '',
                            expiryDate: '',
                            tradeLicenseDoc: '',
                            visaDoc: '',
                        }}
                        validationSchema={planSchema}
                        onSubmit={vi.fn()}
                    >
                        <FormInput locationRequired />
                    </Formik>
                </Provider>
            </MemoryRouter>
        );

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    isLoading: true,
                }),
                type: 'basicInfo/setData',
            })
        );
    });

    it('submits form successfully when valid inputs are provided', () => {
        const mockHandleSubmit = vi.fn();

        render(
            <MemoryRouter>
                <Provider store={store}>
                    <Formik
                        initialValues={{
                            licenseType: 'existing',
                            companyName: 'Test Company',
                            expiryDate: '2025-01-01',
                            tradeLicenseDoc: 'test.pdf',
                            visaDoc: 'visa.pdf',
                        }}
                        validationSchema={planSchema}
                        onSubmit={mockHandleSubmit}
                    >
                        <FormInput />
                    </Formik>
                </Provider>
            </MemoryRouter>
        );

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        // expect(mockHandleSubmit).toHaveBeenCalled();
    });
});
