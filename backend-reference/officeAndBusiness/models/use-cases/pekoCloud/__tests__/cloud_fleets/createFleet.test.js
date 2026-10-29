const { Op } = require("sequelize");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const { createFleet } = require("../../cloud_fleets"); 
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_maintenances.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_usageHistories', () => ({
    belongsTo: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../../../../../configs/database/index', () => ({
    define: jest.fn(),
    transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
    }),
}));

describe('createFleet Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return error if fleet already exists', async () => {
        const data = {
            vehicleNumber: '12345',
            credentialId: 1
        };
    
        cloud_fleets.findOne.mockResolvedValue({
            id: 1,
            vehicleNumber: '12345',
            credentialId: 1,
        });
    
        const result = await createFleet(data);
    
        expect(cloud_fleets.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { vehicleNumber: data.vehicleNumber, credentialId: data.credentialId },
                ],
            },
        });
    
        expect(result).toEqual({
            success: false,
            error: "Fleet with this vehicle number already exists",
        });
    });
    

    it('should return error if employee does not exist', async () => {
        const data = {
            vehicleName: 'New Vehicle',
            vehicleNumber: '67890',
            credentialId: 1,
            cloudEmployeeId: 2
        };

        cloud_fleets.findOne.mockResolvedValue(null);
        cloud_employees.findOne.mockResolvedValue(null);

        const result = await createFleet(data);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({
            where: { id: data.cloudEmployeeId },
        });

        expect(result).toEqual({ success: false, error: "employee is not existing with the given details" });
    });

    it('should successfully create a fleet and usage history', async () => {
        const data = {
            vehicleName: 'New Vehicle',
            vehicleNumber: '67890',
            credentialId: 1,
            cloudEmployeeId: 2
        };

        cloud_fleets.findOne.mockResolvedValue(null);
        cloud_employees.findOne.mockResolvedValue({ id: 2 });
        cloud_fleets.create.mockResolvedValue({ id: 1, ...data, createdAt: new Date() });
        cloud_usageHistories.create.mockResolvedValue({ id: 1 });

        const result = await createFleet(data);

        expect(cloud_fleets.create).toHaveBeenCalledWith(data, { transaction: expect.any(Object) });
        expect(cloud_usageHistories.create).toHaveBeenCalledWith({
            cloudEmployeeId: data.cloudEmployeeId,
            usageCategory: 'FLEET',
            cloudFleetId: 1,
            assignDate: expect.any(Date),
            credentialId: data.credentialId
        }, { transaction: expect.any(Object) });

        expect(result).toEqual({ success: true, data: { id: 1, createdAt: expect.any(Date), ...data } });
    });

    it('should handle transaction rollback on failure', async () => {
        const data = {
            vehicleName: 'New Vehicle',
            vehicleNumber: '67890',
            credentialId: 1
        };

        cloud_fleets.findOne.mockResolvedValue(null);
        cloud_employees.findOne.mockResolvedValue(null);
        cloud_fleets.create.mockRejectedValue(new Error('Database error'));

        const result = await createFleet(data);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle errors during usage history creation', async () => {
        const data = {
            vehicleName: 'New Vehicle',
            vehicleNumber: '67890',
            credentialId: 1,
            cloudEmployeeId: 2
        };

        cloud_fleets.findOne.mockResolvedValue(null);
        cloud_employees.findOne.mockResolvedValue({ id: 2 });
        cloud_fleets.create.mockResolvedValue({ id: 1, ...data, createdAt: new Date() });
        cloud_usageHistories.create.mockRejectedValue(new Error('Database error'));

        const result = await createFleet(data);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
