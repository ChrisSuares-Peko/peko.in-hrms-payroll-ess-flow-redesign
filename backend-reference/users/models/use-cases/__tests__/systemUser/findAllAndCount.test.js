const { findAllAndCount } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');
const wallet = require('../../../entities/wallet');

jest.mock('../../../entities/systemUser', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({}));
jest.mock('../../../entities/wallet', () => ({
    findAll: jest.fn(),
}));

describe('systemUser - findAllAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    it('should return paginated system users with wallet balances', async () => {
        const mockData = {
            rows: [
                { id: 1, credentialId: 10, credential: { username: 'user1' } },
            ],
            count: 1,
        };
        systemUser.findAndCountAll.mockResolvedValue(mockData);
        wallet.findAll.mockResolvedValue([
            { credentialId: 10, balance: 500 },
        ]);

        const result = await findAllAndCount({
            start: 0,
            length: 10,
            draw: 1,
            searchText: '',
            order: 'DESC',
            column: 0,
            userId: 99,
        });

        expect(systemUser.findAndCountAll).toHaveBeenCalled();
        expect(wallet.findAll).toHaveBeenCalled();
        expect(result.rows[0].balance).toBe(500);
    });

    it('should use default column for invalid column index', async () => {
        systemUser.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        wallet.findAll.mockResolvedValue([]);

        await findAllAndCount({
            start: 0,
            length: 10,
            draw: 1,
            searchText: 'test',
            order: 'ASC',
            column: 99,
            userId: 1,
        });

        expect(systemUser.findAndCountAll).toHaveBeenCalled();
    });
});
