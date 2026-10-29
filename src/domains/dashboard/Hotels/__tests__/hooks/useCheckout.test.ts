import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { tboBalance } from '@domains/dashboard/Hotels/Api';
import useForm from '@domains/dashboard/Hotels/hooks/useCheckout';
import { setPaymentData } from '@domains/dashboard/payments/slices/payment';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(() => vi.fn()), 
}));

vi.mock('@src/routes/paths', () => ({
    paths: {
        dashboard: {
            corporateTravel: '/dashboard/corporate-travel',
            payments: '/dashboard/payments',
        },
        hotels: {
            index: '/hotels',
            details: '/details',
            hotelView: '/hotel-view',
            userDetails: '/user-details',
            bookings: '/bookings',
        },
    },
}));

vi.mock('@domains/dashboard/payments/slices/payment', async importOriginal => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        setPaymentData: vi.fn(),
    };
});
vi.mock('@utils/accessKeys', () => ({
    accessKeys: { hotels: 'mockAccessKey' },
}));
vi.mock('react-router-dom', () => {
    const navigateMock = vi.fn();
    return {
        useNavigate: vi.fn(() => navigateMock),
    };
});
vi.mock('@domains/dashboard/Hotels/Api', () => ({
    tboBalance: vi.fn(),
}));

describe('useForm', () => {
    const mockDispatch = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useNavigate as any).mockReturnValue(mockNavigate);

       (useAppSelector as any).mockImplementation((selector: any) =>
    selector({
        reducer: {
            auth: { role: 'user', id: '123' },
            hotels: {
                hotelsRequest: {
                    CheckIn: '2024-08-01',
                    CheckOut: '2024-08-05',
                    GuestNationality: 'US',
                },
                hotelResponse: {
                    HotelDetails: [
                        {
                            HotelName: 'Mock Hotel',
                            Images: ['mock-image.jpg'],
                            CheckInTime: '12:00 PM',
                            CheckOutTime: '11:00 AM',
                        },
                    ],
                },
                prebookResponse: {
                    HotelResult: [
                        {
                            Rooms: [
                                {
                                    BookingCode: 'mockBookingCode',
                                    LastCancellationDeadline: '2024-07-30',
                                    CancelPolicies: 'Mock Cancel Policies',
                                    Name: 'Room 1',
                                    IsRefundable: true,
                                },
                            ],
                        },
                    ],
                    ValidationInfo: {
                        PackageFare: false,
                        IsPackageDetailsMandatory: false,
                    },
                },
                userdetails: [
                    {
                        passengers: [
                            {
                                Title: 'Mr',
                                FirstName: 'John',
                                LastName: 'Doe',
                                PaxType: 1,
                                LeadPassenger: true,
                                Age: 30,
                            },
                        ],
                    },
                ],
                netAmount: {
                    netAmount: 1000,
                    totalFare: 1000,
                },
                customerInfo: {},
            },
        },
    })
);

        vi.mocked(tboBalance).mockResolvedValueOnce(true);
    });

    it('should handle form submission and dispatch payment data', async () => {
        const { result } = renderHook(() => useForm());

        await act(async () => {
            await result.current.handleSubmission();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            setPaymentData({
                billSummary: [
                    { key: 'Service name', value: 'Hotels' },
                    { key: 'Hotel name', value: 'Mock Hotel' },
                    { key: 'Amount', value: '1000.00' },
                ],
                paymentSummary: [{ key: 'Platform fee (inclusive of VAT)', value: '0' }],
                totalAmount: 1000,
                title: 'Bill Summary',
                payload: {
                    userId: '123',
                    userType: 'user',
                    BookingCode: 'mockBookingCode',
                    GuestNationality: 'US',
                    HotelRoomsDetails: [
                        {
                            HotelPassenger: [
                                {
                                    Title: 'Mr.',
                                    FirstName: 'John',
                                    MiddleName: '',
                                    LastName: 'Doe',
                                    Email: null,
                                    PaxType: 1,
                                    LeadPassenger: true,
                                    Age: 30,
                                    PassportNo: null,
                                    PassportIssueDate: null,
                                    PassportExpDate: null,
                                    Phoneno: null,
                                    PaxId: undefined,
                                    GSTCompanyAddress: null,
                                    GSTCompanyContactNumber: null,
                                    GSTCompanyName: null,
                                    GSTNumber: null,
                                    GSTCompanyEmail: null,
                                    PAN: null,
                                },
                            ],
                        },
                    ],
                    NetAmount: 1000,
                    accessKey: 'mockAccessKey',
                    currentUrl: window.location.href,
                    checkInDate: '2024-08-01',
                    checkOutDate: '2024-08-05',
                    HotelImage: 'mock-image.jpg',
                    LastCancellationDate: '2024-07-30',
                    CancelPolicies: 'Mock Cancel Policies',
                    HotelName: 'Mock Hotel',
                    TotalRooms: 1,
                },
                url: 'payment-gateway/wallet-payments/create',
                earningCashbackAmount: 0,
            })
        );

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });
});
