import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVisaAddOns, useVisaPayment } from '../../hooks/useVisaApi';
import VisaPayment from '../../pages/VisaPayment';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useLocation: vi.fn(),
}));

vi.mock('@src/routes/paths', () => ({
    paths: {
        dashboard: { home: '/dashboard' },
        visa: { index: 'visa', visaSuccess: 'success' },
    },
}));

vi.mock('../../hooks/useVisaApi', () => ({
    useVisaPayment: vi.fn(),
    useVisaAddOns: vi.fn(),
}));

const baseVisa = {
    product_id: 101,
    productId: 101,
    name: 'Dubai Tourist Visa 30 Days',
    days: 30,
    price: 970,
    pricePerPerson: 970,
    totalPayNow: 970,
    entryType: 'Single',
    processingTime: '3-5 days',
    visaType: 'evisa',
};

const basePassenger = {
    firstName: 'John',
    lastName: 'Doe',
    passportNo: 'P1234567',
    dob: '1990-01-01',
    type: 'adult',
    contactNumber: '9876543210',
    stagedDocuments: [{ document_code: 'PASSPORT_FRONT', s3Key: 's3/PASSPORT_FRONT' }],
};

const baseState = {
    visa: baseVisa,
    travellers: { adults: 1, children: 0, infants: 0 },
    destination: 'United Arab Emirates',
    destinationId: 233,
    visaType: 'evisa',
    travelDate: '2025-06-01',
    visaBaseAmount: 970,
    productBreakup: { breakup: {}, age_cost_breakup: {} },
    companyName: 'Peko Travels',
    billingEmail: 'billing@peko.one',
    phoneNumber: '9876543210',
    billingAddressLine1: '123 Street',
    billingAddressLine2: '',
    billingCity: 'Mumbai',
    billingState: 'Maharashtra',
    billingPincode: '400001',
    passengers: [basePassenger],
};

describe('VisaPayment Page', () => {
    let mockInitiatePayment: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockInitiatePayment = vi.fn().mockResolvedValue(undefined);
        (useVisaPayment as any).mockReturnValue({ initiatePayment: mockInitiatePayment });
        (useVisaAddOns as any).mockReturnValue({
            addOns: [{ name: 'Visa Concierge', description: 'Get help from our expert', price: 500, price_type: 'flat_fee' }],
            isLoading: false,
        });
        (useLocation as any).mockReturnValue({ state: baseState });
    });

    it('should render without crashing', () => {
        render(<VisaPayment />);
        expect(screen.getByText('Review & Pay')).toBeInTheDocument();
    });

    it('should display step indicators', () => {
        render(<VisaPayment />);
        expect(screen.getByText('Select Visa')).toBeInTheDocument();
        expect(screen.getByText('Traveller Details')).toBeInTheDocument();
    });

    it('should display visa product name', () => {
        render(<VisaPayment />);
        expect(screen.getByText('Dubai Tourist Visa 30 Days')).toBeInTheDocument();
    });

    it('should display add-on services section', () => {
        render(<VisaPayment />);
        expect(screen.getByText('Visa Concierge')).toBeInTheDocument();
    });

    it('should display Continue button', () => {
        render(<VisaPayment />);
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    // ─── initiatePayment call shape ────────────────────────────────────────────

    it('should call initiatePayment with visa, applicant and order-creation fields sourced from router state', async () => {
        render(<VisaPayment />);

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => expect(mockInitiatePayment).toHaveBeenCalledTimes(1));

        expect(mockInitiatePayment).toHaveBeenCalledWith(
            expect.objectContaining({
                visa: baseVisa,
                travellers: baseState.travellers,
                visaAmount: baseState.visaBaseAmount,
                productId: baseVisa.productId,
                travelDate: baseState.travelDate,
                companyName: baseState.companyName,
                billingEmail: baseState.billingEmail,
                phoneNumber: baseState.phoneNumber,
                billingAddressLine1: baseState.billingAddressLine1,
                billingAddressLine2: baseState.billingAddressLine2,
                billingCity: baseState.billingCity,
                billingState: baseState.billingState,
                billingPincode: baseState.billingPincode,
                productBreakup: baseState.productBreakup,
                applicants: [
                    expect.objectContaining({
                        firstName: 'John',
                        lastName: 'Doe',
                        dob: '1990-01-01',
                        passportNo: 'P1234567',
                        contactNumber: '9876543210',
                        documents: basePassenger.stagedDocuments,
                    }),
                ],
            })
        );
    });

    it('should not call initiatePayment when there are no passengers in router state', async () => {
        (useLocation as any).mockReturnValue({ state: { ...baseState, passengers: [] } });

        render(<VisaPayment />);

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(mockInitiatePayment).not.toHaveBeenCalled();
        });
    });
});
