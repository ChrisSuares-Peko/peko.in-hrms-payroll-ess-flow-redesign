import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MockStoreEnhanced } from 'redux-mock-store';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { store, createTestStore } from '@store/store';

import FormComponent from '../../components/subscriptionSummary/FormComponent';
import * as useFormModule from '../../hooks/useForm';

vi.mock('react-router-dom', async importOriginal => {
    const actual: {} = await importOriginal();
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('Form Component', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let mockStore: MockStoreEnhanced<unknown, {}>;
    const mockNavigate = vi.fn();
    const handleSubmissionMock = vi.fn();
    const handleFormSubmitMock = vi.fn();
    beforeEach(() => {
        // Initialize the mock store with the initial state of your Redux store
        mockStore = createTestStore(store.getState());
        (useNavigate as Mock).mockReturnValue(mockNavigate);
        handleSubmissionMock.mockClear();
        cleanup();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('renders FormComponent with all fields', () => {
        render(
            <Provider store={store}>
                <FormComponent />
            </Provider>
        );

        expect(screen.getByText(/Company Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Domain Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Email ID/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Buy Now/i })).toBeInTheDocument();
    });

    test('shows validation errors when required fields are empty', async () => {
        render(
            <Provider store={store}>
                <FormComponent />
            </Provider>
        );

        fireEvent.click(screen.getByRole('button', { name: /Buy Now/i }));

        expect(await screen.findByText(/Please enter the company name/i)).toBeInTheDocument();
        expect(await screen.findByText(/Please enter the email ID/i)).toBeInTheDocument();
    });

    test('submits the form with correct values', async () => {
        vi.spyOn(useFormModule, 'default').mockReturnValue({
            handleSubmission: handleSubmissionMock,
            handleFormSubmit: handleFormSubmitMock,
        });
        render(
            <Provider store={store}>
                <FormComponent />
            </Provider>
        );
        act(() => {
            fireEvent.change(screen.getByPlaceholderText('Enter company name'), {
                target: { value: 'Test Company' },
            });
            fireEvent.change(screen.getByPlaceholderText('Enter domain name'), {
                target: { value: 'test-domain.com' },
            });
            fireEvent.change(screen.getByPlaceholderText('Enter email ID'), {
                target: { value: 'test@example.com' },
            });
        });

        // Submit the form
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Buy Now/i }));
        });

        // Check if handleSubmissionMock was called with the correct values
        expect(handleSubmissionMock).toHaveBeenCalledWith({
            companyName: 'Test Company',
            domainName: 'test-domain.com',
            adminEmail: 'test@example.com',
        });
    });

    test('allows only lowercase characters in the adminEmail field', async () => {
        // Render the component with the mock store
        render(
            <Provider store={store}>
                <FormComponent />
            </Provider>
        );

        // Get the email input field
        const emailInput = screen.getByPlaceholderText(/Enter email ID/i);

        // Simulate user typing in the email input field
        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'UPPERCASE@EXAMPLE.COM' } });
        });

        // Assert that the input value is transformed to lowercase

        expect((emailInput as HTMLInputElement).value).toBe('uppercase@example.com');
    });
});
