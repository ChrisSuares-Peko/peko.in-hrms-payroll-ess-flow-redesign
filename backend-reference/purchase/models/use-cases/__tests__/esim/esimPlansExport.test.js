const { esimPlansExport } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');
const { formattedDateTime, formatNumberWithLocalString } = require('../../../../utils/formatter');
const { Op } = require("sequelize");

jest.mock('../../../entities/esim', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(),
    formatNumberWithLocalString: jest.fn(), // ✅ Added missing mock
}));

describe('esimPlansExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        formatNumberWithLocalString.mockImplementation(num => num.toString()); // ✅ ensures consistent output
    });

    it('should return formatted eSIM plans for export', async () => {
        const mockParams = { searchText: 'Test', sort: 'ASC', sortField: 'name' };
        const mockResult = {
            rows: [
                {
                    createdAt: new Date('2023-01-01T00:00:00Z'),
                    name: 'Test Plan',
                    dataMBs: 2048,
                    periodDays: 30,
                    amount: 20,
                    country: 'USA',
                    status: 1,
                },
            ],
        };

        formattedDateTime.mockImplementation(date => date.toISOString());
        esim.findAndCountAll.mockResolvedValue(mockResult);

        const result = await esimPlansExport(mockParams);

        expect(esim.findAndCountAll).toHaveBeenCalledWith({
            where: expect.any(Object),
            order: [['name', 'ASC']],
        });

        expect(result).toEqual([
            {
                "Date": "2023-01-01T00:00:00.000Z",
                "Name": "Test Plan",
                "Data Pack": "2 GB",
                "Validity": "30 days",
                "Amount": "₹ 20",                 // ✅ Updated to the correct format
                "Country": "USA",
                "Status": "Active",
            },
        ]);
    });

    it('should return an empty array if no eSIM plans match the search', async () => {
        esim.findAndCountAll.mockResolvedValue({ rows: [] });

        const result = await esimPlansExport({ searchText: 'Invalid' });

        expect(result).toEqual([]);
    });

    it('should return eSIM plans filtered by search text', async () => {
        const mockParams = { searchText: 'Test' };
        const mockResult = {
            rows: [
                {
                    name: 'Test Plan',
                    country: 'USA',
                    status: 1,
                },
            ],
        };

        esim.findAndCountAll.mockResolvedValue(mockResult);

        const result = await esimPlansExport(mockParams);

        expect(esim.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    [Op.or]: expect.arrayContaining([
                        { name: { [Op.like]: '%Test%' } },
                        { country: { [Op.like]: '%Test%' } },
                        { coverageId: { [Op.like]: '%Test%' } },
                        { planId: { [Op.like]: '%Test%' } },
                        { dataMBs: { [Op.like]: '%Test%' } },
                        { periodDays: { [Op.like]: '%Test%' } },
                        { amount: { [Op.like]: '%Test%' } },
                        { status: { [Op.like]: '%Test%' } },
                    ]),
                },
            })
        );

        expect(result).toEqual([
            {
                "Date": "Not Available",
                "Name": "Test Plan",
                "Data Pack": "Not Available",
                "Validity": "Not Available",
                "Amount": "₹ 0.00",
                "Country": "USA",
                "Status": "Active",
            },
        ]);
    });
});
