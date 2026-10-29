const axios = require('axios');
const { validateCashfreeBankAccount } = require('../../verifyAccount');

jest.mock('axios');
jest.mock('../../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

describe('validateCashfreeBankAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CASH_FREE_API_URL = 'https://api.cashfree.com';
        process.env.CASHFREE_CLIENT_ID = 'test_client_id';
        process.env.CASHFREE_CLIENT_SECRET = 'test_client_secret';
    });

    it('should return valid true when account_status is VALID (no name match)', async () => {
        axios.post.mockResolvedValueOnce({
            data: { account_status: 'VALID', account_status_code: 'VALID', name_at_bank: null },
        });

        const result = await validateCashfreeBankAccount({
            payload: {
                beneficiary_details: { name: 'John Doe' },
                perform_name_match: false,
            },
        });

        expect(result.valid).toBe(true);
        expect(result.accountValid).toBe(true);
        expect(result.nameMatch).toBeNull();
        expect(result.message).toBe('Bank account verified successfully');
    });

    it('should return valid true when account is VALID and name matches', async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                account_status: 'VALID',
                name_at_bank: 'john doe',
                name_match_score: 95,
            },
        });

        const result = await validateCashfreeBankAccount({
            payload: {
                beneficiary_details: { name: 'John Doe' },
                perform_name_match: true,
            },
        });

        expect(result.valid).toBe(true);
        expect(result.accountValid).toBe(true);
        expect(result.nameMatch).toBe(true);
        expect(result.nameAtBank).toBe('john doe');
        expect(result.nameMatchScore).toBe(95);
        expect(result.message).toBe('Bank account verified successfully');
    });

    it('should return valid false when account is VALID but name does not match', async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                account_status: 'VALID',
                name_at_bank: 'Jane Smith',
                name_match_score: 10,
            },
        });

        const result = await validateCashfreeBankAccount({
            payload: {
                beneficiary_details: { name: 'John Doe' },
                perform_name_match: true,
            },
        });

        expect(result.valid).toBe(false);
        expect(result.accountValid).toBe(true);
        expect(result.nameMatch).toBe(false);
        expect(result.message).toBe(
            'Bank account holder name does not match. Please enter the name exactly as per bank records.'
        );
    });

    it('should return valid false when account_status is INVALID', async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                account_status: 'INVALID',
                account_status_code: 'ACCOUNT_CLOSED',
            },
        });

        const result = await validateCashfreeBankAccount({
            payload: {
                beneficiary_details: { name: 'John Doe' },
                perform_name_match: false,
            },
        });

        expect(result.valid).toBe(false);
        expect(result.accountValid).toBe(false);
        expect(result.message).toBe('ACCOUNT_CLOSED');
    });

    it('should return valid false with default message when account invalid and no status code', async () => {
        axios.post.mockResolvedValueOnce({
            data: { account_status: 'INVALID' },
        });

        const result = await validateCashfreeBankAccount({
            payload: {
                beneficiary_details: {},
                perform_name_match: false,
            },
        });

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Bank account verification failed');
    });

    it('should return valid false and not throw when axios call fails', async () => {
        const error = new Error('Network error');
        error.response = { data: { message: 'Service unavailable' } };
        axios.post.mockRejectedValueOnce(error);

        const result = await validateCashfreeBankAccount({
            payload: {
                beneficiary_details: { name: 'John Doe' },
                perform_name_match: false,
            },
        });

        expect(result.valid).toBe(false);
        expect(result.accountValid).toBe(false);
        expect(result.nameMatch).toBeNull();
        expect(result.message).toBe('Service unavailable');
        expect(result.response).toEqual({ message: 'Service unavailable' });
    });

    it('should fall back to err.message when axios error has no response data', async () => {
        axios.post.mockRejectedValueOnce(new Error('Timeout'));

        const result = await validateCashfreeBankAccount({
            payload: {
                beneficiary_details: {},
                perform_name_match: false,
            },
        });

        expect(result.valid).toBe(false);
        expect(result.message).toBe('Timeout');
        expect(result.response).toBeNull();
    });
});
