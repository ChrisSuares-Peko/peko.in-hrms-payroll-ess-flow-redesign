const { deleteFleetMaintenance } = require("../../cloud_fleetMaintenances");
const cloud_maintenances = require("../../../../entities/pekoCloud/cloud_maintenances");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_maintenances', () => ({
    findOne: jest.fn(),
    destroy: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    findOne: jest.fn(),
}));

describe('deleteFleetMaintenance Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully delete maintenance if it exists', async () => {
        const id = 1;
        const existingMaintenance = { id: 1 };

        cloud_maintenances.findOne.mockResolvedValue(existingMaintenance);
        cloud_fleets.findOne.mockResolvedValue({ id: 1 }); // parent fleet owned by caller
        cloud_maintenances.destroy.mockResolvedValue(1); // Number of deleted rows

        const result = await deleteFleetMaintenance(id);

        expect(cloud_maintenances.findOne).toHaveBeenCalledWith({
            where: { id: id, maintenanceCategory: 'FLEET' },
        });
        expect(cloud_maintenances.destroy).toHaveBeenCalledWith({
            where: { id: id, maintenanceCategory: 'FLEET' },
        });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return error if maintenance does not exist', async () => {
        const id = 1;

        cloud_maintenances.findOne.mockResolvedValue(null);

        const result = await deleteFleetMaintenance(id);

        expect(result).toEqual({
            success: false,
            error: "maintenance is not existing with the given details",
        });
    });

    it('should handle cases where no rows are deleted', async () => {
        const id = 1;
        const existingMaintenance = { id: 1 };

        cloud_maintenances.findOne.mockResolvedValue(existingMaintenance);
        cloud_fleets.findOne.mockResolvedValue({ id: 1 }); // parent fleet owned by caller
        cloud_maintenances.destroy.mockResolvedValue(0); // No rows deleted

        const result = await deleteFleetMaintenance(id);

        expect(result).toEqual({
            success: false,
            error: "something went wrong while deleting the maintenance",
        });
    });

    it('should handle database errors during maintenance lookup', async () => {
        const id = 1;

        cloud_maintenances.findOne.mockRejectedValue(new Error('Database error'));

        const result = await deleteFleetMaintenance(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle database errors during delete operation', async () => {
        const id = 1;
        const existingMaintenance = { id: 1 };

        cloud_maintenances.findOne.mockResolvedValue(existingMaintenance);
        cloud_fleets.findOne.mockResolvedValue({ id: 1 }); // parent fleet owned by caller
        cloud_maintenances.destroy.mockRejectedValue(new Error('Database error'));

        const result = await deleteFleetMaintenance(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
