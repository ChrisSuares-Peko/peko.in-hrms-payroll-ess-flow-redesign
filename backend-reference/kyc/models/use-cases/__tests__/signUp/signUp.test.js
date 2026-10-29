jest.mock('otplib', () => ({
    authenticator: {
        check: jest.fn()
    }
}));

const signUpUseCase = require('../../signUp');
const signUp = require('../../../entities/signUp');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const Otp = require('../../../entities/otp');
const { authenticator } = require('otplib');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('create', () => {
    it('should create a sign-up entry', async () => {
        const mockResult = { id: 1, name: 'Test Corp' };
        signUp.create.mockResolvedValue(mockResult);

        const result = await signUpUseCase.create({ name: 'Test Corp' });
        expect(result).toEqual(mockResult);
    });
});

describe('updateDetails', () => {
    it('should update sign-up details', async () => {
        signUp.update.mockResolvedValue([1]);

        const result = await signUpUseCase.updateDetails({ id: 1 }, { status: 'APPROVED' });
        expect(result).toEqual([1]);
    });
});

describe('findOne', () => {
    it('should find one sign-up by id', async () => {
        const mockResult = { id: 1, name: 'Test' };
        signUp.findOne.mockResolvedValue(mockResult);

        const result = await signUpUseCase.findOne({ id: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('findByAnyField', () => {
    it('should find corporate user by any field', async () => {
        const mockResult = { id: 1, email: 'test@test.com' };
        corporateUser.findOne.mockResolvedValue(mockResult);

        const result = await signUpUseCase.findByAnyField({ email: 'test@test.com' });
        expect(result).toEqual(mockResult);
    });
});

describe('findUsername', () => {
    it('should find credential by username', async () => {
        const mockResult = { id: 1, username: 'testuser' };
        credential.findOne.mockResolvedValue(mockResult);

        const result = await signUpUseCase.findUsername('testuser');
        expect(result).toEqual(mockResult);
    });
});

describe('findAllPendingRequest', () => {
    it('should count pending sign-up requests', async () => {
        signUp.count.mockResolvedValue(5);

        const result = await signUpUseCase.findAllPendingRequest();
        expect(result).toBe(5);
    });
});

describe('Delete', () => {
    it('should delete a sign-up entry', async () => {
        signUp.destroy.mockResolvedValue(1);

        const result = await signUpUseCase.Delete({ id: 1 });
        expect(result).toBe(1);
    });
});

describe('createOtp', () => {
    it('should create new OTP when mobile does not exist', async () => {
        Otp.findOne.mockResolvedValue(null);
        Otp.create.mockResolvedValue({ id: 1 });

        const result = await signUpUseCase.createOtp({
            mobile: '1234567890', pin: 'hashed', emailOtp: 'hashed'
        });
        expect(result).toEqual({ id: 1 });
        expect(Otp.create).toHaveBeenCalled();
    });

    it('should update existing OTP for mobile verification', async () => {
        Otp.findOne.mockResolvedValue({ id: 1 });
        Otp.update.mockResolvedValue([1]);

        const result = await signUpUseCase.createOtp({
            mobile: '1234567890', pin: 'hashed', verification: 'mobile'
        });
        expect(result).toEqual([1]);
    });

    it('should update existing OTP for email verification', async () => {
        Otp.findOne.mockResolvedValue({ id: 1 });
        Otp.update.mockResolvedValue([1]);

        const result = await signUpUseCase.createOtp({
            mobile: '1234567890', emailOtp: 'hashed', verification: 'email'
        });
        expect(result).toEqual([1]);
    });
});

describe('otpVerification', () => {
    it('should return false when OTP record not found', async () => {
        Otp.findOne.mockResolvedValue(null);

        const result = await signUpUseCase.otpVerification('123456', 'email123', '1234567890');
        expect(result).toBe(false);
    });

    it('should return false for invalid pin', async () => {
        const mockOtp = {
            validatePin: jest.fn().mockResolvedValue(false),
            validateEmail: jest.fn().mockResolvedValue(true),
            createdAt: new Date()
        };
        Otp.findOne.mockResolvedValue(mockOtp);

        const result = await signUpUseCase.otpVerification('wrong', 'email123', '1234567890');
        expect(result).toBe(false);
    });

    it('should return true on successful verification', async () => {
        const mockOtp = {
            validatePin: jest.fn().mockResolvedValue(true),
            validateEmail: jest.fn().mockResolvedValue(true),
            createdAt: new Date()
        };
        Otp.findOne.mockResolvedValue(mockOtp);
        Otp.update.mockResolvedValue([1]);

        const result = await signUpUseCase.otpVerification('123456', 'email123', '1234567890');
        expect(result).toBe(true);
    });
});

describe('authVerification', () => {
    it('should return valid true when TOTP is correct', async () => {
        corporateUser.findOne.mockResolvedValue({ totpSecret: 'REDACTED' });
        authenticator.check.mockReturnValue(true);

        const result = await signUpUseCase.authVerification(1, '123456');
        expect(result).toEqual({ valid: true });
    });

    it('should throw when user not found (source has NPE bug)', async () => {
        corporateUser.findOne.mockResolvedValue(null);

        // The source accesses user.totpSecret before checking !user
        // which causes a TypeError - asyncHandler catches this
        await expect(signUpUseCase.authVerification(999, '123456'))
            .rejects.toThrow();
    });

    it('should return false for invalid token', async () => {
        corporateUser.findOne.mockResolvedValue({ totpSecret: 'REDACTED' });
        authenticator.check.mockReturnValue(false);

        const result = await signUpUseCase.authVerification(1, 'wrong');
        expect(result).toBe(false);
    });
});

describe('signUpCount', () => {
    it('should return corporate user count', async () => {
        corporateUser.count.mockResolvedValue(10);

        const result = await signUpUseCase.signUpCount();
        expect(result).toBe(10);
    });
});

describe('find', () => {
    it('should find corporate user by email', async () => {
        const mockResult = { id: 1, email: 'test@test.com' };
        corporateUser.findOne.mockResolvedValue(mockResult);

        const result = await signUpUseCase.find({ email: 'test@test.com' });
        expect(result).toEqual(mockResult);
    });
});

describe('findAllandCount', () => {
    it('should find sign-ups with pagination', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        signUp.findAndCountAll.mockResolvedValue(mockData);

        const result = await signUpUseCase.findAllandCount({
            start: 0, length: 10, draw: 1, searchText: '',
            order: 'ASC', column: 0
        });
        expect(result).toEqual(mockData);
    });

    it('should add status filter when selectStatus is provided', async () => {
        const mockData = { count: 0, rows: [] };
        signUp.findAndCountAll.mockResolvedValue(mockData);

        await signUpUseCase.findAllandCount({
            start: 0, length: 10, draw: 1, searchText: '',
            order: 'ASC', column: 0, selectStatus: 'PENDING'
        });
        expect(signUp.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: 'PENDING' })
            })
        );
    });
});

describe('getExcel', () => {
    it('should format sign-up data for Excel', async () => {
        signUp.findAll.mockResolvedValue([{
            id: 1, username: 'user1', name: 'Corp1', email: 'e@e.com',
            mobileNo: '123', firstName: 'John', lastName: 'Doe',
            designation: 'CEO', status: 'APPROVED'
        }]);

        const result = await signUpUseCase.getExcel();
        expect(result[0]['Corporate Name']).toBe('Corp1');
        expect(result[0]['First Name']).toBe('John');
    });
});
