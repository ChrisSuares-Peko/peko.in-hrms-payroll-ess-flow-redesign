const { createFleetMaintenance } = require("../../cloud_fleetMaintenances");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_maintenances = require("../../../../entities/pekoCloud/cloud_maintenances");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_maintenances', () => ({
    create: jest.fn(),
}));

describe('createFleetMaintenance Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create maintenance when fleet exists', async () => {
        const data = {
            cloudFleetId: 1,
            maintenanceCategory: 'Regular Service',
            serviceType: 'Engine Check',
            date: new Date(),
            amount: '1000',
            status: 'Completed',
        };
        const existingFleet = { id: 1 };
        const newMaintenance = { id: 1, ...data };

        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        cloud_maintenances.create.mockResolvedValue(newMaintenance);

        const result = await createFleetMaintenance(data);

        expect(cloud_fleets.findOne).toHaveBeenCalledWith({
            where: { id: data.cloudFleetId },
        });
        expect(cloud_maintenances.create).toHaveBeenCalledWith({
            ...data,
            maintenanceCategory: 'FLEET',
        });

        expect(result).toEqual({ success: true, data: newMaintenance });
    });

    it('should return error if fleet does not exist', async () => {
        const data = {
            cloudFleetId: 1,
            maintenanceCategory: 'Regular Service',
            serviceType: 'Engine Check',
            date: new Date(),
            amount: '1000',
            status: 'Completed',
        };

        cloud_fleets.findOne.mockResolvedValue(null);

        const result = await createFleetMaintenance(data);

        expect(result).toEqual({
            success: false,
            error: "fleet is not existing with the given details",
        });
    });

    it('should return error if maintenance creation fails', async () => {
        const data = {
            cloudFleetId: 1,
            maintenanceCategory: 'Regular Service',
            serviceType: 'Engine Check',
            date: new Date(),
            amount: '1000',
            status: 'Completed',
        };
        const existingFleet = { id: 1 };

        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        cloud_maintenances.create.mockResolvedValue(null);

        const result = await createFleetMaintenance(data);

        expect(result).toEqual({
            success: false,
            error: "Failed to create maintenance.",
        });
    });

    it('should handle database errors during fleet lookup', async () => {
        const data = {
            cloudFleetId: 1,
            maintenanceCategory: 'Regular Service',
            serviceType: 'Engine Check',
            date: new Date(),
            amount: '1000',
            status: 'Completed',
        };

        cloud_fleets.findOne.mockRejectedValue(new Error('Database error'));

        const result = await createFleetMaintenance(data);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle database errors during maintenance creation', async () => {
        const data = {
            cloudFleetId: 1,
            maintenanceCategory: 'Regular Service',
            serviceType: 'Engine Check',
            date: new Date(),
            amount: '1000',
            status: 'Completed',
        };
        const existingFleet = { id: 1 };

        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        cloud_maintenances.create.mockRejectedValue(new Error('Database error'));

        const result = await createFleetMaintenance(data);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
