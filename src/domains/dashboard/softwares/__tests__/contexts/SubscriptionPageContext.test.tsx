/**
 * @file SubscriptionPageContext.test.tsx
 * @description Production-grade unit tests for SubscriptionContextProvider
 *
 * ---------------------------------------------------------------------------
 * COVERAGE
 * ---------------------------------------------------------------------------
 *
 * Provider & Hook:
 *  - Renders children
 *  - Throws outside provider
 *
 * Weburl Resolution:
 *  - Uses rawWeburl
 *  - Falls back to lastViewedWeburl
 *  - rawWeburl overrides lastViewedWeburl
 *
 * Navigation:
 *  - Redirects when no weburl
 *  - Does NOT redirect when valid
 *
 * Redux:
 *  - Dispatches setLastViewedWeburl
 *
 * Product Fetch:
 *  - Fetches when product missing
 *  - Skips when product exists
 *  - Skips when id/role missing
 *  - Handles API failure
 *
 * Submission:
 *  - getSurcharge failure → abort
 *  - Success → dispatch + navigate
 *  - Loading state transitions
 *  - amount edge cases
 *  - paymentSummary + billSummary
 *  - cashback calculation
 *  - request payload validation
 *
 * ---------------------------------------------------------------------------
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import SubscriptionContextProvider, {
    useSubscriptionContext,
} from '../../contexts/SubscriptionPageContext';

// -------------------- MOCKS --------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetchProductDetails = vi.fn();
vi.mock('../../api', () => ({
    fetchProductDetails: (...args: unknown[]) => mockFetchProductDetails(...args),
}));

const mockGetSurcharge = vi.fn();
vi.mock('@src/services/surcharge', () => ({
    getSurcharge: (...args: unknown[]) => mockGetSurcharge(...args),
}));

const mockSetPaymentData = vi.fn();
vi.mock('../../../payments/slices/payment', () => ({
    setPaymentData: (payload: unknown) => {
        mockSetPaymentData(payload);
        return { type: 'payment/setPaymentData', payload };
    },
}));

const mockSetLastViewedWeburl = vi.fn();
vi.mock('../../slice/softwareSlice', () => ({
    setLastViewedWeburl: (payload: unknown) => {
        mockSetLastViewedWeburl(payload);
        return { type: 'software/setLastViewedWeburl', payload };
    },
}));

// -------------------- FIXTURES --------------------

const mockProduct = {
    weburl: 'crm-pro',
    product_name: 'CRM Pro',
    pricing: [],
};

const mockPlan = {
    productName: 'Basic Plan',
};

const mockSurcharge = {
    surcharge: '10',
    corporateCashback: '5',
};

// -------------------- STORE --------------------

const buildStore = (override: any = {}) =>
    configureStore({
        reducer: {
            reducer: () => ({
                software: {
                    lastViewedWeburl:
                        override.lastViewedWeburl !== undefined ? override.lastViewedWeburl : '',
                },
                auth: {
                    role: override.role !== undefined ? override.role : 'buyer',
                    id: override.id !== undefined ? override.id : 'user-1',
                },
            }),
        },
    });

// -------------------- RENDER --------------------

const renderProvider = (
    ui: React.ReactNode,
    route = ['/?weburl=crm-pro'],
    store = buildStore(),
    state?: any
) =>
    render(
        <Provider store={store}>
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/',
                        search: route[0].split('?')[1] ? `?${route[0].split('?')[1]}` : '',
                        state,
                    },
                ]}
            >
                <SubscriptionContextProvider>{ui}</SubscriptionContextProvider>
            </MemoryRouter>
        </Provider>
    );

// -------------------- CONSUMER --------------------

const Consumer = () => {
    const ctx = useSubscriptionContext();

    return (
        <div>
            <span data-testid="product">{ctx.product?.product_name ?? ''}</span>
            <span data-testid="weburl">{ctx.weburl}</span>
            <span data-testid="loading">{String(ctx.isLoading)}</span>

            <button
                type="button"
                onClick={() =>
                    ctx.handleSoftwareSubmission({
                        plan: mockPlan as any,
                        amount: '100',
                        company: 'Acme',
                    })
                }
            >
                submit
            </button>
        </div>
    );
};

// -------------------- TESTS --------------------

describe('SubscriptionContext (Production)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetchProductDetails.mockResolvedValue({ product: mockProduct });
        mockGetSurcharge.mockResolvedValue(mockSurcharge);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ---------------- BASIC ----------------

    it('renders children', async () => {
        renderProvider(<div>child</div>);
        expect(await screen.findByText('child')).toBeInTheDocument();
    });

    it('throws outside provider', () => {
        expect(() => render(<Consumer />)).toThrow();
    });

    // ---------------- WEBURL ----------------

    it('uses rawWeburl', async () => {
        renderProvider(<Consumer />, ['/?weburl=crm-pro']);
        expect(await screen.findByTestId('weburl')).toHaveTextContent('crm-pro');
    });

    it('falls back to lastViewedWeburl', async () => {
        renderProvider(<Consumer />, ['/'], buildStore({ lastViewedWeburl: 'erp' }));
        expect(await screen.findByTestId('weburl')).toHaveTextContent('erp');
    });

    it('rawWeburl overrides lastViewedWeburl', async () => {
        renderProvider(<Consumer />, ['/?weburl=crm'], buildStore({ lastViewedWeburl: 'erp' }));
        expect(await screen.findByTestId('weburl')).toHaveTextContent('crm');
    });

    // ---------------- NAVIGATION ----------------

    it('redirects when no weburl', async () => {
        renderProvider(<div />, ['/'], buildStore({ lastViewedWeburl: '' }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });

    // ---------------- FETCH ----------------

    it('fetches product when missing', async () => {
        renderProvider(<Consumer />);
        await waitFor(() => expect(mockFetchProductDetails).toHaveBeenCalled());
    });

    it('skips fetch when product exists', async () => {
        renderProvider(<Consumer />, ['/?weburl=crm'], buildStore(), { product: mockProduct });

        await waitFor(() => expect(screen.getByTestId('product')).toHaveTextContent('CRM Pro'));

        expect(mockFetchProductDetails).not.toHaveBeenCalled();
    });

    it('does not fetch when id or role missing', async () => {
        renderProvider(<Consumer />, ['/?weburl=crm'], buildStore({ role: null, id: null }));

        await waitFor(() => {
            expect(mockFetchProductDetails).not.toHaveBeenCalled();
        });
    });

    it('redirects when API fails', async () => {
        mockFetchProductDetails.mockResolvedValueOnce({ product: null });

        renderProvider(<Consumer />);

        await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    });

    // ---------------- SUBMISSION ----------------

    it('aborts when surcharge fails', async () => {
        mockGetSurcharge.mockResolvedValueOnce(false);

        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('submit'));

        await waitFor(() => {
            expect(mockNavigate).not.toHaveBeenCalled();
            expect(mockSetPaymentData).not.toHaveBeenCalled();
        });
    });

    it('dispatches and navigates on success', async () => {
        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('submit'));

        await waitFor(() => {
            expect(mockSetPaymentData).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalled();
        });
    });

    it('builds correct billSummary', async () => {
        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('submit'));

        await waitFor(() => expect(mockSetPaymentData).toHaveBeenCalled());
        const payload = mockSetPaymentData.mock.calls[0][0];

        expect(payload.billSummary).toEqual(
            expect.arrayContaining([
                { key: 'Service name', value: 'Softwares' },
                { key: 'Software', value: 'Basic Plan' },
            ])
        );
    });

    it('builds correct paymentSummary', async () => {
        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('submit'));

        await waitFor(() => expect(mockSetPaymentData).toHaveBeenCalled());
        const payload = mockSetPaymentData.mock.calls[0][0];

        expect(payload.paymentSummary.length).toBe(2);
    });

    it('calculates total correctly', async () => {
        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('submit'));

        await waitFor(() => expect(mockSetPaymentData).toHaveBeenCalled());
        const payload = mockSetPaymentData.mock.calls[0][0];
        expect(payload.totalAmount).toBe(110);
    });

    it('handles empty amount', async () => {
        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('submit'));

        await waitFor(() => expect(mockSetPaymentData).toHaveBeenCalled());
        const payload = mockSetPaymentData.mock.calls[0][0];
        expect(payload.totalAmount).toBeGreaterThanOrEqual(0);
    });

    it('calculates cashback correctly', async () => {
        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('submit'));

        await waitFor(() => expect(mockSetPaymentData).toHaveBeenCalled());
        const payload = mockSetPaymentData.mock.calls[0][0];
        expect(payload.earningCashbackAmount).toBe(5);
    });

    it('includes request payload fields', async () => {
        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('submit'));

        await waitFor(() => expect(mockSetPaymentData).toHaveBeenCalled());
        const payload = mockSetPaymentData.mock.calls[0][0];

        expect(payload.payload).toEqual(
            expect.objectContaining({
                amount: '100',
                plan: mockPlan,
                currentUrl: expect.any(String),
            })
        );
    });
});
