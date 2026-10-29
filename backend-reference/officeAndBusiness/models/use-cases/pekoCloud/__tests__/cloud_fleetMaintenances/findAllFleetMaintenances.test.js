const { findAllFleetMaintenances } = require("../../cloud_fleetMaintenances");
const cloud_maintenances = require("../../../../entities/pekoCloud/cloud_maintenances");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require('sequelize');

jest.mock('../../../../entities/pekoCloud/cloud_maintenances', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
}));

describe('findAllFleetMaintenances Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve all fleet maintenances with pagination, sorting, and filtering', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'date';
        const sort = 'DESC';
        const searchText = 'Engine Check';
        const fleetId = 1;
        const offset = (page - 1) * itemsPerPage;

        const maintenancesData = {
            count: 5,
            rows: [
                { id: 1, repairCategory: 'Engine Check', serviceType: 'Full Service', amount: '500', date: new Date() },
                // Add more mock data as needed
            ],
        };

        cloud_fleets.findOne.mockResolvedValue({ id: fleetId }); // fleet owned by caller
        cloud_maintenances.findAndCountAll.mockResolvedValue(maintenancesData);

        const result = await findAllFleetMaintenances(page, itemsPerPage, sortField, sort, searchText, fleetId);

        expect(cloud_maintenances.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { repairCategory: { [Op.like]: `%${searchText}%` } },
                    { serviceType: { [Op.like]: `%${searchText}%` } },
                    { amount: { [Op.like]: `%${searchText}%` } },
                ],
                maintenanceCategory: 'FLEET',
                cloudFleetId: fleetId,
            },
        });

        expect(result).toEqual({ success: true, data: maintenancesData });
    });

    it('should retrieve all fleet maintenances without searchText and fleetId', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'date';
        const sort = 'ASC';

        const maintenancesData = {
            count: 3,
            rows: [
                { id: 1, repairCategory: 'Engine Repair', serviceType: 'Oil Change', amount: '300', date: new Date() },
                // Add more mock data as needed
            ],
        };

        cloud_fleets.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]); // caller's fleets
        cloud_maintenances.findAndCountAll.mockResolvedValue(maintenancesData);

        const result = await findAllFleetMaintenances(page, itemsPerPage, sortField, sort);

        expect(cloud_maintenances.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: 0,
            order: [[sortField, sort]],
            where: {
                maintenanceCategory: 'FLEET',
                cloudFleetId: { [Op.in]: [1, 2] },
            },
        });

        expect(result).toEqual({ success: true, data: maintenancesData });
    });

    it('should handle cases where no maintenances are found', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'date';
        const sort = 'ASC';

        cloud_fleets.findAll.mockResolvedValue([{ id: 1 }]); // caller's fleets
        cloud_maintenances.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllFleetMaintenances(page, itemsPerPage, sortField, sort);

        expect(result).toEqual({ success: true, data: { count: 0, rows: [] } });
    });

    it('should handle database errors', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'date';
        const sort = 'ASC';

        cloud_maintenances.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const result = await findAllFleetMaintenances(page, itemsPerPage, sortField, sort);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
