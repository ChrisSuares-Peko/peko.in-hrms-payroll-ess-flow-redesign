const { deleteEmployee } = require("../../cloud_employees");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const ErrorResponse = require("../../../../../utils/error-response");
const { deleteFile } = require("../../../../../utils/commonUploadFile");

jest.mock('../../../../entities/pekoCloud/cloud_assets', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
    findOne: jest.fn(),
    destroy: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_subscriptions', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_usageHistories', () => ({
    destroy: jest.fn(),
}));
jest.mock('../../../../../utils/commonUploadFile', () => ({
    deleteFile: jest.fn(),
}));

describe('deleteEmployee Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully delete an existing employee with a profile picture', async () => {
        const id = 1;
        const employee = { id: 1, profilePicture: 'profilePicUrl', credentialId: 2 };

        cloud_employees.findOne.mockResolvedValue(employee);
        cloud_assets.findAll.mockResolvedValue([]); // No assigned assets
        cloud_fleets.findAll.mockResolvedValue([]); // No assigned fleets
        cloud_subscriptions.findAll.mockResolvedValue([]); // No assigned subscriptions
        cloud_usageHistories.destroy.mockResolvedValue(1); // Usage histories removed
        deleteFile.mockResolvedValue(); // Simulate successful deletion
        cloud_employees.destroy.mockResolvedValue(1); // Indicating successful deletion

        const result = await deleteEmployee(id);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteFile).toHaveBeenCalledWith('profilePicUrl');
        expect(cloud_employees.destroy).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should successfully delete an existing employee without a profile picture', async () => {
        const id = 1;
        const employee = { id: 1, profilePicture: null, credentialId: 2 };

        cloud_employees.findOne.mockResolvedValue(employee);
        cloud_assets.findAll.mockResolvedValue([]); // No assigned assets
        cloud_fleets.findAll.mockResolvedValue([]); // No assigned fleets
        cloud_subscriptions.findAll.mockResolvedValue([]); // No assigned subscriptions
        cloud_usageHistories.destroy.mockResolvedValue(1); // Usage histories removed
        cloud_employees.destroy.mockResolvedValue(1); // Indicating successful deletion

        const result = await deleteEmployee(id);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteFile).not.toHaveBeenCalled();
        expect(cloud_employees.destroy).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return an error if the employee does not exist', async () => {
        const id = 1;

        cloud_employees.findOne.mockResolvedValue(null); // No employee found

        const result = await deleteEmployee(id);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({
            success: false,
            error: "employee is not existing with the given details",
        });
    });

    it('should return an error if the employee is assigned with assets, fleets, or subscriptions', async () => {
        const id = 1;
        const employee = { id: 1, profilePicture: null, credentialId: 2 };

        cloud_employees.findOne.mockResolvedValue(employee);
        cloud_assets.findAll.mockResolvedValue([{ id: 1 }]); // Assigned assets
        cloud_fleets.findAll.mockResolvedValue([]); // No assigned fleets
        cloud_subscriptions.findAll.mockResolvedValue([]); // No assigned subscriptions

        const result = await deleteEmployee(id);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_assets.findAll).toHaveBeenCalledWith({ where: { cloudEmployeeId: id } });
        expect(result).toEqual({
            success: false,
            error: "employee is assigned with assets, fleet or subscriptions in peko cloud",
        });
    });

    it('should return an error if the deletion operation fails', async () => {
        const id = 1;
        const employee = { id: 1, profilePicture: null, credentialId: 2 };

        cloud_employees.findOne.mockResolvedValue(employee);
        cloud_assets.findAll.mockResolvedValue([]); // No assigned assets
        cloud_fleets.findAll.mockResolvedValue([]); // No assigned fleets
        cloud_subscriptions.findAll.mockResolvedValue([]); // No assigned subscriptions
        cloud_usageHistories.destroy.mockResolvedValue(1); // Usage histories removed
        cloud_employees.destroy.mockResolvedValue(0); // No rows deleted

        const result = await deleteEmployee(id);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_employees.destroy).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({
            success: false,
            error: "employee is not existing with the given details",
        });
    });

    it('should handle profile picture deletion failure', async () => {
        const id = 1;
        const employee = { id: 1, profilePicture: 'profilePicUrl', credentialId: 2 };

        cloud_employees.findOne.mockResolvedValue(employee);
        cloud_assets.findAll.mockResolvedValue([]); // No assigned assets
        cloud_fleets.findAll.mockResolvedValue([]); // No assigned fleets
        cloud_subscriptions.findAll.mockResolvedValue([]); // No assigned subscriptions
        cloud_usageHistories.destroy.mockResolvedValue(1);
        deleteFile.mockRejectedValue(new Error('deletion error')); // Simulate deletion error

        const result = await deleteEmployee(id);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteFile).toHaveBeenCalledWith('profilePicUrl');
        expect(cloud_employees.destroy).not.toHaveBeenCalled();
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle unexpected errors', async () => {
        const id = 1;

        cloud_employees.findOne.mockRejectedValue(new Error('Database error'));

        const result = await deleteEmployee(id);

        expect(cloud_employees.findOne).toHaveBeenCalled();
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
