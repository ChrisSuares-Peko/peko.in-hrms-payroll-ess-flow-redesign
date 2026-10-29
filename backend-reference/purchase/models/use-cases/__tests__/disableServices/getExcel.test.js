const { getExcel } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/disabledService', () => ({
    findAndCountAll: jest.fn(),
}));

describe('getExcel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted disableService data for Excel export', async () => {
        const mockData = {
            rows: [
                {
                    Id: 1,
                    serviceOperator: { serviceProvider: 'Operator A' },
                    credentialId: 101,
                    credential: { name: 'Corporate A' },
                    serviceStatus: 'Active',
                },
                {
                    Id: 2,
                    serviceOperator: { serviceProvider: null },
                    credentialId: null,
                    credential: { name: null },
                    serviceStatus: null,
                },
            ],
        };

        disableService.findAndCountAll.mockResolvedValue(mockData);

        const result = await getExcel();

        expect(disableService.findAndCountAll).toHaveBeenCalledWith({
            include: [
                { model: serviceOperator, as: '', attributes: ['serviceProvider'] },
                { model: credential, as: '', attributes: ['name'] },
            ],
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true,
        });

        expect(result).toEqual([
            {
                'ID': 1,
                'Service Operator': 'Operator A',
                'CorporateId': 101,
                'Corporate Name': 'Corporate A',
                'Service Status': 'Active',
            },
            {
                'ID': 2,
                'Service Operator': 'Not Available',
                'CorporateId': 'Not Available',
                'Corporate Name': 'Not Available',
                'Service Status': 'Not Available',
            },
        ]);
    });

    it('should return an empty array if no data is found', async () => {
        disableService.findAndCountAll.mockResolvedValue({ rows: [] });

        const result = await getExcel();

        expect(result).toEqual([]);
    });

    it('should throw an error if database query fails', async () => {
        const mockError = new Error('Database error');

        disableService.findAndCountAll.mockRejectedValue(mockError);

        await expect(getExcel()).rejects.toThrow('Database error');
    });
});
