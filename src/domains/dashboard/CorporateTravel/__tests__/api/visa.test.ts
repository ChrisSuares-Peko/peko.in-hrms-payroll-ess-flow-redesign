import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '@src/services/config';

import {
    createVisaOrder,
    getApplicationStatus,
    getOrderStatus,
    getVisaCountries,
    getVisaDestinations,
    getVisaProductDocuments,
    listVisaBookings,
    searchVisaOptions,
    stageVisaDocument,
    uploadApplicantDocument,
} from '../../api/visa';

vi.mock('@src/services/config', () => ({
    ApiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const AUTH = { userType: 'user', userId: 1 };

describe('Visa API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getVisaDestinations ───────────────────────────────────────────────────

    describe('getVisaDestinations', () => {
        it('should return destinations array on success', async () => {
            const mockData = [
                { destination: 'United Arab Emirates', country_id: 233, visa_types: ['evisa'], visa_categories: ['Tourist', 'Business'] },
                { destination: 'Singapore', country_id: 197, visa_types: ['evisa'], visa_categories: ['Tourist'] },
            ];
            (ApiClient.get as any).mockResolvedValue({ data: mockData });

            const result = await getVisaDestinations(AUTH);

            expect(ApiClient.get).toHaveBeenCalledWith('user/1/travel/visa/destinations');
            expect(result).toEqual(mockData);
        });

        it('should return false when API throws', async () => {
            (ApiClient.get as any).mockRejectedValue(new Error('Network error'));

            const result = await getVisaDestinations(AUTH);

            expect(result).toBe(false);
        });
    });

    // ─── getVisaCountries ──────────────────────────────────────────────────────

    describe('getVisaCountries', () => {
        it('should return countries array on success', async () => {
            const mockCountries = [
                { id: 103, name: 'India', code: 'IN' },
                { id: 233, name: 'United Arab Emirates', code: 'AE' },
            ];
            (ApiClient.get as any).mockResolvedValue({ data: mockCountries });

            const result = await getVisaCountries(AUTH);

            expect(ApiClient.get).toHaveBeenCalledWith('user/1/travel/visa/countries');
            expect(result).toEqual(mockCountries);
        });

        it('should return false on error', async () => {
            (ApiClient.get as any).mockRejectedValue(new Error('Timeout'));

            const result = await getVisaCountries(AUTH);

            expect(result).toBe(false);
        });
    });

    // ─── searchVisaOptions ─────────────────────────────────────────────────────

    describe('searchVisaOptions', () => {
        const searchPayload = {
            ...AUTH,
            residency: 103,
            nationality: 103,
            destination: 233,
            travelDate: '2025-06-01',
            category: 'Tourist',
            adult: 2,
            child: 1,
            infant: 0,
        };

        it('should call the correct endpoint with query params and return products', async () => {
            const mockProducts = [{ product_id: 101, visa_name: 'Dubai Tourist Visa 30 Days' }];
            (ApiClient.get as any).mockResolvedValue({ data: mockProducts });

            const result = await searchVisaOptions(searchPayload);

            expect(ApiClient.get).toHaveBeenCalledWith(
                'user/1/travel/visa/search',
                expect.objectContaining({
                    params: expect.objectContaining({
                        residency: 103,
                        nationality: 103,
                        destination: 233,
                        adult: 2,
                        child: 1,
                        infant: 0,
                        category: 'Tourist',
                    }),
                })
            );
            expect(result).toEqual(mockProducts);
        });

        it('should not include userType or userId in query params', async () => {
            (ApiClient.get as any).mockResolvedValue({ data: [] });

            await searchVisaOptions(searchPayload);

            const calledParams = (ApiClient.get as any).mock.calls[0][1].params;
            expect(calledParams).not.toHaveProperty('userType');
            expect(calledParams).not.toHaveProperty('userId');
        });

        it('should return false on error', async () => {
            (ApiClient.get as any).mockRejectedValue(new Error('Error'));

            const result = await searchVisaOptions(searchPayload);

            expect(result).toBe(false);
        });
    });

    // ─── getVisaProductDocuments ───────────────────────────────────────────────

    describe('getVisaProductDocuments', () => {
        it('should return required documents for a product', async () => {
            const mockDocs = [
                { id: 1, document_code: 'PASSPORT', display_value: 'Valid Passport', document_category: 'ID', description: 'Must be valid for 6 months' },
            ];
            (ApiClient.get as any).mockResolvedValue({ data: mockDocs });

            const result = await getVisaProductDocuments({ ...AUTH, product_id: 101 });

            expect(ApiClient.get).toHaveBeenCalledWith(
                'user/1/travel/visa/product-documents',
                expect.objectContaining({ params: { product_id: 101 } })
            );
            expect(result).toEqual(mockDocs);
        });

        it('should return false on error', async () => {
            (ApiClient.get as any).mockRejectedValue(new Error('Error'));

            const result = await getVisaProductDocuments({ ...AUTH, product_id: 101 });

            expect(result).toBe(false);
        });
    });

    // ─── createVisaOrder ───────────────────────────────────────────────────────

    describe('createVisaOrder', () => {
        const orderPayload = {
            ...AUTH,
            customer_email: 'john@example.com',
            customer_first_name: 'John',
            customer_last_name: 'Doe',
            customer_mobile: '9876543210',
            customer_billing_address_line_1: '',
            customer_billing_pincode: '',
            customer_billing_state: 'MH',
            customer_billing_state_tax_code: '27',
            customer_billing_country: 'IN',
            customer_billing_city: 'Mumbai',
            order_type: 'RETAIL',
            source: 'WEB',
            branch_code: 'MHL',
            client_code: 'OVRT-001',
            group_name: 'W1',
            adult: 1,
            child: 0,
            infant: 0,
            residency: 103,
            nationality: 103,
            product_id: 101,
            amount: 970,
            applicants: [{ dob: '1990-01-01', last_name: 'Doe', first_name: 'John', passport_no: 'P1234567' }],
            travel_date: '2025-06-01',
            unique_identifier: '1748000000000',
            partner: 'Peko',
            base_currency: 'INR',
        };

        const mockResponse = {
            status: true,
            message: 'Order created successfully',
            data: {
                order_number: 'VZA-2025-001',
                applications: [
                    { id: 42, dob: '1990-01-01', last_name: 'Doe', first_name: 'John', passport_no: 'P1234567', category: 'adult' },
                ],
            },
        };

        it('should post to the correct endpoint and return the full response', async () => {
            (ApiClient.post as any).mockResolvedValue(mockResponse);

            const result = await createVisaOrder(orderPayload);

            expect(ApiClient.post).toHaveBeenCalledWith(
                'user/1/travel/visa/order/create',
                expect.not.objectContaining({ userType: 'user', userId: 1 })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should strip userType and userId from the request body', async () => {
            (ApiClient.post as any).mockResolvedValue(mockResponse);

            await createVisaOrder(orderPayload);

            const postedBody = (ApiClient.post as any).mock.calls[0][1];
            expect(postedBody).not.toHaveProperty('userType');
            expect(postedBody).not.toHaveProperty('userId');
        });

        it('should return false on error', async () => {
            (ApiClient.post as any).mockRejectedValue(new Error('Server error'));

            const result = await createVisaOrder(orderPayload);

            expect(result).toBe(false);
        });
    });

    // ─── uploadApplicantDocument ───────────────────────────────────────────────

    describe('uploadApplicantDocument', () => {
        const uploadPayload = {
            ...AUTH,
            application_id: 42,
            order_number: 'VZA-2025-001',
            document_code: 'PASSPORT_FRONT',
            file: new File(['passport-image'], 'passport.jpg', { type: 'image/jpeg' }),
        };

        it('should post FormData with correct headers to the upload endpoint', async () => {
            const mockResponse = { status: true, message: 'Document uploaded' };
            (ApiClient.post as any).mockResolvedValue(mockResponse);

            const result = await uploadApplicantDocument(uploadPayload);

            expect(ApiClient.post).toHaveBeenCalledWith(
                'user/1/travel/visa/order/upload-document',
                expect.any(FormData),
                expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should include all required fields in FormData', async () => {
            (ApiClient.post as any).mockResolvedValue({ status: true, message: 'OK' });

            await uploadApplicantDocument(uploadPayload);

            const formData: FormData = (ApiClient.post as any).mock.calls[0][1];
            expect(formData.get('document_code')).toBe('PASSPORT_FRONT');
            expect(formData.get('application_id')).toBe('42');
            expect(formData.get('order_number')).toBe('VZA-2025-001');
            expect(formData.get('file')).toBeInstanceOf(File);
        });

        it('should return false on error', async () => {
            (ApiClient.post as any).mockRejectedValue(new Error('Upload failed'));

            const result = await uploadApplicantDocument(uploadPayload);

            expect(result).toBe(false);
        });
    });

    // ─── stageVisaDocument ─────────────────────────────────────────────────────

    describe('stageVisaDocument', () => {
        const stagePayload = {
            ...AUTH,
            document_code: 'PASSPORT_FRONT',
            file: new File(['passport-image'], 'passport.jpg', { type: 'image/jpeg' }),
        };

        it('should post FormData with correct headers to the stage-document endpoint', async () => {
            const mockResponse = { status: true, data: { s3Key: 's3/PASSPORT_FRONT', documentCode: 'PASSPORT_FRONT' } };
            (ApiClient.post as any).mockResolvedValue(mockResponse);

            const result = await stageVisaDocument(stagePayload);

            expect(ApiClient.post).toHaveBeenCalledWith(
                'user/1/travel/visa/order/stage-document',
                expect.any(FormData),
                expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should include the file and document_code fields in FormData', async () => {
            (ApiClient.post as any).mockResolvedValue({ status: true, data: { s3Key: 's3/PASSPORT_FRONT', documentCode: 'PASSPORT_FRONT' } });

            await stageVisaDocument(stagePayload);

            const formData: FormData = (ApiClient.post as any).mock.calls[0][1];
            expect(formData.get('document_code')).toBe('PASSPORT_FRONT');
            expect(formData.get('file')).toBeInstanceOf(File);
        });

        it('should return false on error', async () => {
            (ApiClient.post as any).mockRejectedValue(new Error('Upload failed'));

            const result = await stageVisaDocument(stagePayload);

            expect(result).toBe(false);
        });
    });

    // ─── getApplicationStatus ──────────────────────────────────────────────────

    describe('getApplicationStatus', () => {
        it('should return application status on success', async () => {
            const mockStatus = { status_code: 'UNDER_REVIEW', terminal: 0, frontend_status: 'Under Review' };
            (ApiClient.get as any).mockResolvedValue({ data: mockStatus });

            const result = await getApplicationStatus({ ...AUTH, application_id: 42, order_number: 'VZA-2025-001' });

            expect(ApiClient.get).toHaveBeenCalledWith(
                'user/1/travel/visa/order/application-status',
                expect.objectContaining({ params: { application_id: 42, order_number: 'VZA-2025-001' } })
            );
            expect(result).toEqual(mockStatus);
        });

        it('should return false on error', async () => {
            (ApiClient.get as any).mockRejectedValue(new Error('Error'));

            const result = await getApplicationStatus({ ...AUTH, application_id: 42, order_number: 'VZA-2025-001' });

            expect(result).toBe(false);
        });
    });

    // ─── getOrderStatus ────────────────────────────────────────────────────────

    describe('getOrderStatus', () => {
        it('should return list of applicant statuses on success', async () => {
            const mockStatuses = [
                { id: 42, name: 'John Doe', status: { status_code: 'APPROVED', terminal: 1, frontend_status: 'Visa Approved' } },
                { id: 43, name: 'Jane Smith', status: { status_code: 'UNDER_REVIEW', terminal: 0, frontend_status: 'Under Review' } },
            ];
            (ApiClient.get as any).mockResolvedValue({ data: mockStatuses });

            const result = await getOrderStatus({ ...AUTH, order_number: 'VZA-2025-001' });

            expect(ApiClient.get).toHaveBeenCalledWith(
                'user/1/travel/visa/order/status',
                { params: { order_number: 'VZA-2025-001' } }
            );
            expect(result).toEqual(mockStatuses);
        });

        it('should return false on error', async () => {
            (ApiClient.get as any).mockRejectedValue(new Error('Error'));

            const result = await getOrderStatus({ ...AUTH, order_number: 'VZA-2025-001' });

            expect(result).toBe(false);
        });
    });

    // ─── listVisaBookings ──────────────────────────────────────────────────────

    describe('listVisaBookings', () => {
        it('should return paginated bookings with date filters', async () => {
            const mockBookings = {
                data: [{ id: 1, destination: 'UAE', status: 'approved' }],
                total: 1,
            };
            (ApiClient.get as any).mockResolvedValue({ data: mockBookings });

            const result = await listVisaBookings({ ...AUTH, from: '2025-01-01', to: '2025-06-01', page: 1, limit: 10 });

            expect(ApiClient.get).toHaveBeenCalledWith(
                'user/1/travel/visa/bookings',
                expect.objectContaining({
                    params: expect.objectContaining({ from: '2025-01-01', to: '2025-06-01', page: 1, limit: 10 }),
                })
            );
            expect(result).toEqual(mockBookings);
        });

        it('should work without optional filters', async () => {
            (ApiClient.get as any).mockResolvedValue({ data: [] });

            const result = await listVisaBookings(AUTH);

            expect(ApiClient.get).toHaveBeenCalledWith(
                'user/1/travel/visa/bookings',
                expect.objectContaining({ params: expect.objectContaining({}) })
            );
            expect(result).toEqual([]);
        });

        it('should return false on error', async () => {
            (ApiClient.get as any).mockRejectedValue(new Error('Error'));

            const result = await listVisaBookings(AUTH);

            expect(result).toBe(false);
        });
    });
});
