const { pendingSignUpsExport } = require('../../../use-cases/signUpActivityLog');
const sequelizeConfig = require('../../../../configs/database/index');

// No local jest.mock for configs/database/index - use global mock from setup.js  

describe('pendingSignUpsExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();  
    });

    it('should return formatted data when no filters are applied', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: null,
            to: null,
            partnerId: null
        };

        const mockData = [
            {
                id: 1,
                createdAt: '2023-01-01',
                partnerId: 1,
                partnerName: 'Partner 1',
                contactPersonName: 'John Doe',
                email: 'test@test.com',
                mobileNo: '1234567890',
                companyName: 'Company 1',
                referralCode: 'XYZ123',
                isPasswordCreated: 1,
                isEmailOTPValidated: 1,
                isMobileOTPValidated: 1,
                status: 'PENDING'
            }
        ];

        sequelizeConfig.query.mockResolvedValueOnce(mockData); // Mocking the database response

        const result = await pendingSignUpsExport(mockParams);

        expect(result).toEqual([
            {
                Date: '2023-01-01', // Assuming formattedDateTime function formats correctly
                "Company Name": 'Company 1',
                "Email ID": 'test@test.com',
                "Mobile Number": '1234567890',
                "Partner ID": 1,
                "Partner Name": 'Partner 1',
                "Password Created": 'Yes',
                "Email OTP Validated": 'Yes',
                "Mobile OTP Validated": 'Yes',
                "Status": 'PENDING'
            }
        ]);
    });

    it('should handle date range filters correctly', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: '2023-01-01',
            to: '2023-12-31',
            partnerId: null
        };

        const mockData = [
            {
                id: 1,
                createdAt: '2023-01-01',
                partnerId: 1,
                partnerName: 'Partner 1',
                contactPersonName: 'John Doe',
                email: 'test@test.com',
                mobileNo: '1234567890',
                companyName: 'Company 1',
                referralCode: 'XYZ123',
                isPasswordCreated: 1,
                isEmailOTPValidated: 1,
                isMobileOTPValidated: 1,
                status: 'PENDING'
            }
        ];

        sequelizeConfig.query.mockResolvedValueOnce(mockData); // Mocking the database response

        const result = await pendingSignUpsExport(mockParams);

        expect(result).toEqual([
            {
                Date: '2023-01-01',
                "Company Name": 'Company 1',
                "Email ID": 'test@test.com',
                "Mobile Number": '1234567890',
                "Partner ID": 1,
                "Partner Name": 'Partner 1',
                "Password Created": 'Yes',
                "Email OTP Validated": 'Yes',
                "Mobile OTP Validated": 'Yes',
                "Status": 'PENDING'
            }
        ]);

        // `from` is bound as-is; `to` is normalized to the start of the day after
        // the selected end date (inclusive range), so it is a Date, not the raw string.
        const [, options] = sequelizeConfig.query.mock.calls[0];
        expect(options.replacements.from).toBe(mockParams.from);
        expect(options.replacements.to).toBeInstanceOf(Date);
    });

    it('should handle partnerId filter correctly', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: null,
            to: null,
            partnerId: 1
        };

        const mockData = [
            {
                id: 1,
                createdAt: '2023-01-01',
                partnerId: 1,
                partnerName: 'Partner 1',
                contactPersonName: 'John Doe',
                email: 'test@test.com',
                mobileNo: '1234567890',
                companyName: 'Company 1',
                referralCode: 'XYZ123',
                isPasswordCreated: 1,
                isEmailOTPValidated: 1,
                isMobileOTPValidated: 1,
                status: 'PENDING'
            }
        ];

        sequelizeConfig.query.mockResolvedValueOnce(mockData); // Mocking the database response

        const result = await pendingSignUpsExport(mockParams);

        expect(result).toEqual([
            {
                Date: '2023-01-01',
                "Company Name": 'Company 1',
                "Email ID": 'test@test.com',
                "Mobile Number": '1234567890',
                "Partner ID": 1,
                "Partner Name": 'Partner 1',
                "Password Created": 'Yes',
                "Email OTP Validated": 'Yes',
                "Mobile OTP Validated": 'Yes',
                "Status": 'PENDING'
            }
        ]);

        // Ensure the query is being called with the correct replacements
        expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            replacements: expect.objectContaining({
                partnerId: mockParams.partnerId
            })
        }));
    });

    it('should handle partnerId as "default" correctly', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: null,
            to: null,
            partnerId: "default"
        };

        const mockData = [
            {
                id: 1,
                createdAt: '2023-01-01',
                partnerId: null,
                partnerName: 'Partner 1',
                contactPersonName: 'John Doe',
                email: 'test@test.com',
                mobileNo: '1234567890',
                companyName: 'Company 1',
                referralCode: 'XYZ123',
                isPasswordCreated: 1,
                isEmailOTPValidated: 1,
                isMobileOTPValidated: 1,
                status: 'PENDING'
            }
        ];

        sequelizeConfig.query.mockResolvedValueOnce(mockData); // Mocking the database response

        const result = await pendingSignUpsExport(mockParams);

        expect(result).toEqual([
            {
                Date: '2023-01-01',
                "Company Name": 'Company 1',
                "Email ID": 'test@test.com',
                "Mobile Number": '1234567890',
                "Partner ID": 'Not Available',
                "Partner Name": 'Partner 1',
                "Password Created": 'Yes',
                "Email OTP Validated": 'Yes',
                "Mobile OTP Validated": 'Yes',
                "Status": 'PENDING'
            }
        ]);

        // "default" means "no partner": the SQL filters on IS NULL and partnerId
        // is intentionally NOT bound as a replacement.
        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain('partnerId IS NULL');
        expect(options.replacements).not.toHaveProperty('partnerId');
    });

    it('should handle errors and throw an exception', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: null,
            to: null,
            partnerId: null
        };

        const errorMessage = new Error("Database error");

        // Mock the query to reject with an error
        sequelizeConfig.query.mockRejectedValueOnce(errorMessage);

        await expect(pendingSignUpsExport(mockParams)).rejects.toEqual({
            message: 'Something went wrong',
        });
    });

    it('should bind the status as a replacement and never inline it (SQL injection guard)', async () => {
        const malicious = "PENDING' OR '1'='1";
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: null,
            to: null,
            partnerId: null,
            status: malicious,
        };

        sequelizeConfig.query.mockResolvedValueOnce([]);

        await pendingSignUpsExport(mockParams);

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        // The raw value must not appear inline in the SQL string...
        expect(sql).not.toContain("OR '1'='1");
        // ...it must be bound through parameterized replacements instead.
        expect(options.replacements).toEqual(
            expect.objectContaining({ status: malicious })
        );
    });

    it('should default the status filter to PENDING when none is provided', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: null,
            to: null,
            partnerId: null,
        };

        sequelizeConfig.query.mockResolvedValueOnce([]);

        await pendingSignUpsExport(mockParams);

        const [, options] = sequelizeConfig.query.mock.calls[0];
        expect(options.replacements).toEqual(
            expect.objectContaining({ status: 'PENDING' })
        );
    });
});
