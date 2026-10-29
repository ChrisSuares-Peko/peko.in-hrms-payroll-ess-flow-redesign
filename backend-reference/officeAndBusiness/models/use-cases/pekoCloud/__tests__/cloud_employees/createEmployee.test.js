const { createEmployee } = require("../../cloud_employees");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { Op } = require('sequelize');
const { findMaximumUsageLimit } = require("../../../subscription");
const { uploadFile } = require("../../../../../utils/commonUploadFile");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({
    belongsTo: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

jest.mock('../../../subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
}));

describe('createEmployee Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create an employee when no duplicate exists and file upload is successful', async () => {
        const data = {
            employeeName: 'John Doe',
            employeeEmail: 'john.doe@example.com',
            employeeID: 'EMP123',
            credentialId: 1,
            profileImageBase: 'base64string',
            profileImageFormat: 'jpg',
        };
        const user = { role: 'CORPORATE_USER', username: 'john_doe', corporateId: 1 };

        cloud_employees.findOne.mockResolvedValue(null); // No existing employee
        cloud_employees.create.mockResolvedValue({ id: 1, profilePicture: 'https://s3.amazonaws.com/bucket/profile.jpg', ...data });
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFile.mockResolvedValue('https://s3.amazonaws.com/bucket/profile.jpg');

        const result = await createEmployee(data, user);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { employeeEmail: data.employeeEmail, credentialId: data.credentialId },
                    { employeeID: data.employeeID, credentialId: data.credentialId },
                ],
            },
        });
        expect(uploadFile).toHaveBeenCalledWith(
            data.profileImageBase,
            `${user.role.toLowerCase()}/${user.username}/peko-cloud`,
            data.profileImageFormat,
            1000
        );
        expect(cloud_employees.create).toHaveBeenCalledWith(expect.objectContaining({
            ...data,
            profilePicture: 'https://s3.amazonaws.com/bucket/profile.jpg',
        }));
        expect(result).toEqual({
            success: true,
            data: { id: 1, profilePicture: 'https://s3.amazonaws.com/bucket/profile.jpg', ...data },
        });
    });

    it('should return error if employee with the same email or ID already exists', async () => {
        const data = {
            employeeName: 'Jane Doe',
            employeeEmail: 'jane.doe@example.com',
            employeeID: 'EMP124',
            credentialId: 1,
        };
        const user = { role: 'CORPORATE_USER', username: 'jane_doe', corporateId: 1 };
    
        cloud_employees.findOne.mockResolvedValue({ id: 1, ...data });
    
        const result = await createEmployee(data, user);
    
        expect(cloud_employees.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { employeeEmail: data.employeeEmail, credentialId: data.credentialId },
                    { employeeID: data.employeeID, credentialId: data.credentialId },
                ],
            },
        });
        expect(result).toEqual({
            success: false,
            error: "Employee with this email id or employee id already exists",
            data: { id: 1, ...data }, // Include the "data" field in the expectation
        });
    });
    

    it('should handle file upload failure gracefully', async () => {
        const data = {
            employeeName: 'Alice Smith',
            employeeEmail: 'alice.smith@example.com',
            employeeID: 'EMP125',
            credentialId: 1,
            profileImageBase: 'base64string',
            profileImageFormat: 'png',
        };
        const user = { role: 'CORPORATE_USER', username: 'alice_smith', corporateId: 1 };

        cloud_employees.findOne.mockResolvedValue(null);
        findMaximumUsageLimit.mockResolvedValue(1000);
        uploadFile.mockRejectedValue(new Error('Upload failed'));

        const result = await createEmployee(data, user);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { employeeEmail: data.employeeEmail, credentialId: data.credentialId },
                    { employeeID: data.employeeID, credentialId: data.credentialId },
                ],
            },
        });
        expect(uploadFile).toHaveBeenCalledWith(
            data.profileImageBase,
            `${user.role.toLowerCase()}/${user.username}/peko-cloud`,
            data.profileImageFormat,
            1000
        );
        expect(cloud_employees.create).not.toHaveBeenCalled();
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle failure to create employee', async () => {
        const data = {
            employeeName: 'Bob Johnson',
            employeeEmail: 'bob.johnson@example.com',
            employeeID: 'EMP126',
            credentialId: 1,
        };
        const user = { role: 'CORPORATE_USER', username: 'bob_johnson', corporateId: 1 };

        cloud_employees.findOne.mockResolvedValue(null);
        cloud_employees.create.mockResolvedValue(null); // Simulating creation failure

        const result = await createEmployee(data, user);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { employeeEmail: data.employeeEmail, credentialId: data.credentialId },
                    { employeeID: data.employeeID, credentialId: data.credentialId },
                ],
            },
        });
        expect(cloud_employees.create).toHaveBeenCalledWith({
            ...data,
            subCorporateUserId: user.role === 'CORPORATE_SUB_USER' ? user.subCorporateId : undefined,
        });
        expect(result).toEqual({ success: false, error: "Failed to create employee." });
    });

    it('should handle unexpected errors', async () => {
        const data = {
            employeeName: 'Charlie Brown',
            employeeEmail: 'charlie.brown@example.com',
            employeeID: 'EMP127',
            credentialId: 1,
        };
        const user = { role: 'CORPORATE_USER', username: 'charlie_brown', corporateId: 1 };

        cloud_employees.findOne.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await createEmployee(data, user);

        expect(cloud_employees.findOne).toHaveBeenCalled();
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
