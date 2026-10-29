const { getExcelCSVData } = require('../../../use-cases/cashback');
const cashback = require('../../../entities/cashback');
const serviceOperator = require('../../../entities/serviceOperator');
const packageModel = require('../../../entities/package');

jest.mock('../../../entities/cashback', () => ({
    findAndCountAll: jest.fn(),
}));

describe('getExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted cashback data for CSV export', async () => {
        const mockData = {
            rows: [
                {
                    serviceOperator: { serviceProvider: 'Operator A' },
                    cashbackType: 'Fixed',
                    package: { packageName: 'Package A' },
                    serviceStatus: true,
                    cashback: 50,
                    surcharge: 5,
                },
                {
                    serviceOperator: { serviceProvider: null },
                    cashbackType: null,
                    package: { packageName: null },
                    serviceStatus: false,
                    cashback: null,
                    surcharge: null,
                },
            ],
        };

        cashback.findAndCountAll.mockResolvedValue(mockData);

        const result = await getExcelCSVData();

        expect(cashback.findAndCountAll).toHaveBeenCalledWith({
            include: [
                { model: serviceOperator, as: '', attributes: ['serviceProvider'] },
                { model: packageModel, as: '', attributes: ['packageName'] },
            ],
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true,
        });

        expect(result).toEqual([
            {
                'Service Operator': 'Operator A',
                'Commission Type': 'Fixed',
                'Package Name': 'Package A',
                'Status': 'Active',
                'Cashback': 50,
                'Surcharge': 5,
            },
            {
                'Service Operator': 'Not Available',
                'Commission Type': 'Not Available',
                'Package Name': 'Not Available',
                'Status': 'Inactive',
                'Cashback': 'Not Available',
                'Surcharge': 'Not Available',
            },
        ]);
    });

    it('should return an empty array if no data is found', async () => {
        cashback.findAndCountAll.mockResolvedValue({ rows: [] });

        const result = await getExcelCSVData();

        expect(result).toEqual([]);
    });

    it('should throw an error if database query fails', async () => {
        const mockError = new Error('Database error');

        cashback.findAndCountAll.mockRejectedValue(mockError);

        await expect(getExcelCSVData()).rejects.toThrow('Database error');
    });
});
