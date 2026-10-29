const { excelCsvData } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');
const wallet = require('../../../entities/wallet');

jest.mock('../../../entities/systemUser', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({}));
jest.mock('../../../entities/wallet', () => ({
    findAll: jest.fn(),
}));

describe('systemUser - excelCsvData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted CSV data with wallet balances', async () => {
        systemUser.findAndCountAll.mockResolvedValue({
            rows: [
                {
                    id: 1,
                    isActive: 1,
                    email: 'test@test.com',
                    credentialId: 10,
                    credential: { username: 'user1', name: 'User One' },
                },
            ],
            count: 1,
        });
        wallet.findAll.mockResolvedValue([
            { credentialId: 10, balance: 500 },
        ]);

        const result = await excelCsvData({
            order: 'DESC',
            column: 'createdAt',
            userId: 99,
        });

        expect(result).toEqual([
            {
                'Id': 1,
                'username': 'user1',
                'Name': 'User One',
                'Email': 'test@test.com',
                'Status': 'True',
            },
        ]);
    });

    it('should handle missing fields with "Not Available"', async () => {
        systemUser.findAndCountAll.mockResolvedValue({
            rows: [
                {
                    id: 2,
                    isActive: 0,
                    email: null,
                    credentialId: 20,
                    credential: { username: null, name: null },
                },
            ],
            count: 1,
        });
        wallet.findAll.mockResolvedValue([]);

        const result = await excelCsvData({
            order: 'DESC',
            column: 'createdAt',
            userId: 99,
        });

        expect(result).toEqual([
            {
                'Id': 2,
                'username': 'Not Available',
                'Name': 'Not Available',
                'Email': 'Not Available',
                'Status': 'false',
            },
        ]);
    });
});
