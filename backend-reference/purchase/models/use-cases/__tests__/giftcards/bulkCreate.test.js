const { bulkCreate } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');
const sequelize = require('../../../../configs/database/index');

jest.mock('../../../entities/giftCards', () => ({
    bulkCreate: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => ({
    transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
    }),
    define: jest.fn()
}));

jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/categories', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../models/entities/credential', () => {
    const credentialMock = {
        prototype: {
            getResetPasswordToken: jest.fn(),
        },
    };
    return credentialMock;
});
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/softwares', () => ({
    belongsTo: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
describe('bulkCreate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should bulk create gift cards successfully', async () => {
        const mockParams = [
            { name: 'Amazon Gift Card', brand_logo: 'logo1.png' },
            { name: 'Google Play Gift Card', brand_logo: 'logo2.png' }
        ];
        const mockTransaction = await sequelize.transaction();
        const mockGiftCards = mockParams.map((item, index) => ({ id: index + 1, ...item }));

        giftCards.bulkCreate.mockResolvedValue(mockGiftCards);

        const result = await bulkCreate(mockParams);

        expect(giftCards.bulkCreate).toHaveBeenCalledWith(mockParams, { transaction: mockTransaction });
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual(mockGiftCards);
    });

  it('should return false if bulk creation fails', async () => {
    const mockParams = [
        { name: 'Amazon Gift Card', brand_logo: 'logo1.png' },
        { name: 'Google Play Gift Card', brand_logo: 'logo2.png' }
    ];

    giftCards.bulkCreate.mockResolvedValue(null);

    const result = await bulkCreate(mockParams);
    const mockTransaction = await sequelize.transaction.mock.results[0].value;

    expect(result).toBe(false);
    expect(mockTransaction.rollback).toHaveBeenCalled();
});



    it('should handle errors and rollback transaction if bulk creation fails', async () => {
    const mockParams = [
        { name: 'Amazon Gift Card', brand_logo: 'logo1.png' },
        { name: 'Google Play Gift Card', brand_logo: 'logo2.png' }
    ];

    const mockError = new Error('Database error');

    giftCards.bulkCreate.mockRejectedValue(mockError);

    const result = await bulkCreate(mockParams);

    const mockTransaction = await sequelize.transaction.mock.results[0].value;

    expect(result).toBe(false);
    expect(mockTransaction.rollback).toHaveBeenCalled();
});

});
