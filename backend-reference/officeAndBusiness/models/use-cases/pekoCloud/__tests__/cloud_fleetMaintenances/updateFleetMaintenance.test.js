const { updateFleetMaintenance } = require("../../cloud_fleetMaintenances");
const cloud_maintenances = require("../../../../entities/pekoCloud/cloud_maintenances");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_maintenances', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    findOne: jest.fn(),
}));

describe('updateFleetMaintenance Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update maintenance when both maintenance and fleet exist', async () => {
        const id = 1;
        const newData = {
            cloudFleetId: 1,
            repairCategory: 'Engine Repair',
            serviceType: 'Oil Change',
            amount: '350',
        };
        const existingMaintenance = { id: 1 };
        const existingFleet = { id: 1 };

        cloud_maintenances.findOne.mockResolvedValue(existingMaintenance);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        cloud_maintenances.update.mockResolvedValue([1]);

        const result = await updateFleetMaintenance(id, newData);

        expect(cloud_maintenances.findOne).toHaveBeenCalledWith({
            where: { id: id, maintenanceCategory: 'FLEET' },
        });
        expect(cloud_fleets.findOne).toHaveBeenCalledWith({
            where: { id: newData.cloudFleetId },
        });
        expect(cloud_maintenances.update).toHaveBeenCalledWith(newData, {
            where: { id: id, maintenanceCategory: 'FLEET' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return error if maintenance does not exist', async () => {
        const id = 1;
        const newData = {
            cloudFleetId: 1,
        };

        cloud_maintenances.findOne.mockResolvedValue(null);

        const result = await updateFleetMaintenance(id, newData);

        expect(result).toEqual({
            success: false,
            error: "maintenance is not existing with the given details",
        });
    });

    it('should return error if fleet does not exist', async () => {
        const id = 1;
        const newData = {
            cloudFleetId: 1,
        };
        const existingMaintenance = { id: 1 };

        cloud_maintenances.findOne.mockResolvedValue(existingMaintenance);
        cloud_fleets.findOne
            .mockResolvedValueOnce({ id: 1 }) // ownership of the existing parent fleet passes
            .mockResolvedValueOnce(null); // the reassigned fleet does not exist

        const result = await updateFleetMaintenance(id, newData);

        expect(result).toEqual({
            success: false,
            error: "fleet is not existing with the given details",
        });
    });

    it('should return error if update operation fails', async () => {
        const id = 1;
        const newData = {
            cloudFleetId: 1,
        };
        const existingMaintenance = { id: 1 };
        const existingFleet = { id: 1 };

        cloud_maintenances.findOne.mockResolvedValue(existingMaintenance);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        cloud_maintenances.update.mockResolvedValue([0]);

        const result = await updateFleetMaintenance(id, newData);

        expect(result).toEqual({
            success: false,
            error: "something went wrong while updating the maintenance",
        });
    });

    it('should handle database errors during maintenance lookup', async () => {
        const id = 1;
        const newData = {
            cloudFleetId: 1,
        };

        cloud_maintenances.findOne.mockRejectedValue(new Error('Database error'));

        const result = await updateFleetMaintenance(id, newData);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle database errors during fleet lookup', async () => {
        const id = 1;
        const newData = {
            cloudFleetId: 1,
        };
        const existingMaintenance = { id: 1 };

        cloud_maintenances.findOne.mockResolvedValue(existingMaintenance);
        cloud_fleets.findOne.mockRejectedValue(new Error('Database error'));

        const result = await updateFleetMaintenance(id, newData);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle database errors during update operation', async () => {
        const id = 1;
        const newData = {
            cloudFleetId: 1,
        };
        const existingMaintenance = { id: 1 };
        const existingFleet = { id: 1 };

        cloud_maintenances.findOne.mockResolvedValue(existingMaintenance);
        cloud_fleets.findOne.mockResolvedValue(existingFleet);
        cloud_maintenances.update.mockRejectedValue(new Error('Database error'));

        const result = await updateFleetMaintenance(id, newData);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
