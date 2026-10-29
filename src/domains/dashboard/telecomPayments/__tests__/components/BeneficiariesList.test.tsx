import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { vi, describe, expect, beforeEach, test } from 'vitest';

import BeneficiariesList from '../../components/BeneficiariesList';

vi.mock('../../components/BeneficiaryCard', () => ({
    default: ({ beneficiary, handleEdit }: any) => (
        <div data-testid="beneficiary-card">
            <p>{beneficiary.name}</p>
            <button type="button" onClick={handleEdit}>
                Edit
            </button>
        </div>
    ),
}));

vi.mock('../../components/BeneficiaryModal', () => ({
    default: ({ open, onCancel }: any) =>
        open ? (
            <div data-testid="beneficiary-modal">
                <button type="button" onClick={onCancel}>
                    Close
                </button>
            </div>
        ) : null,
}));

const mockStore = configureStore([]);
const accessKeyName = 'service1';

describe('BeneficiariesList Component', () => {
    let store: any;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                beneficiary: {
                    beneficiaryData: [
                        {
                            id: 1,
                            name: 'John Doe',
                            accessKey: 'electricity_123',
                            billerId: 'BILL123',
                            phoneNo: '9876543210',
                            providerCircle: 'Delhi NCR',
                            serviceProvider: 'XYZ Electricity Co.',
                        },
                    ],
                    isLoading: false,
                },
            },
        });
        store.dispatch = vi.fn();
    });

    test('renders beneficiary list correctly', async () => {
        await act(async () => {
            render(
                <Provider store={store}>
                    <BeneficiariesList accessKeyName="testAccessKey" />
                </Provider>
            );
        });

        expect(await screen.findByText('Your Beneficiaries')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Add Beneficiary')).toBeInTheDocument();
    });

    test('shows loading skeleton when data is loading', () => {
        store = mockStore({
            reducer: {
                beneficiary: {
                    beneficiaryData: [],
                    isLoading: true,
                },
            },
        });

        render(
            <Provider store={store}>
                <BeneficiariesList accessKeyName={accessKeyName} />
            </Provider>
        );

        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    test('shows empty state when there are no beneficiaries', () => {
        store = mockStore({
            reducer: {
                beneficiary: {
                    beneficiaryData: [],
                    isLoading: false,
                },
            },
        });

        render(
            <Provider store={store}>
                <BeneficiariesList accessKeyName={accessKeyName} />
            </Provider>
        );

        expect(screen.getByText(/no beneficiaries found/i)).toBeInTheDocument();
    });

    test('opens modal when "Add Beneficiary" button is clicked', async () => {
        render(
            <Provider store={store}>
                <BeneficiariesList accessKeyName={accessKeyName} />
            </Provider>
        );

        fireEvent.click(screen.getByText('Add Beneficiary'));

        await waitFor(() => expect(screen.getByTestId('beneficiary-modal')).toBeInTheDocument());
    });

    test('opens modal when "Edit" button is clicked', async () => {
        render(
            <Provider store={store}>
                <BeneficiariesList accessKeyName={accessKeyName} />
            </Provider>
        );

        fireEvent.click(screen.getByText('Edit'));

        await waitFor(() => expect(screen.getByTestId('beneficiary-modal')).toBeInTheDocument());
    });

    test('closes modal when "Close" button is clicked', async () => {
        render(
            <Provider store={store}>
                <BeneficiariesList accessKeyName={accessKeyName} />
            </Provider>
        );

        fireEvent.click(screen.getByText('Add Beneficiary'));

        await waitFor(() => expect(screen.getByTestId('beneficiary-modal')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Close'));

        await waitFor(() =>
            expect(screen.queryByTestId('beneficiary-modal')).not.toBeInTheDocument()
        );
    });
});
