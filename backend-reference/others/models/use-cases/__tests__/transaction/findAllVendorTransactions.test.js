const { findAllVendorTransactions } = require('../../transaction');
const { Op } = require('sequelize');
const orders = require('../../../entities/order');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const transaction = require('../../../entities/transaction');
const vendor = require('../../../entities/vendor');
const { handleSortFields } = require("../../../../utils/sortHandle");

jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn()
}));
jest.mock('../../../entities/order');
jest.mock('../../../entities/serviceOperator');
jest.mock('../../../entities/credential');
jest.mock('../../../entities/vendor');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn()
}));

describe('findAllVendorTransactions', () => {
  const mockParams = {
    vendorId: 1,
    from: '2025-01-01',
    to: '2025-01-31',
    limit: 10,
    offset: 0,
    searchText: 'test',
    sort: 'ASC',
    sortField: 'transactionDate',
  };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call transaction.findAndCountAll with correct parameters and return results', async () => {
        // Arrange
        const params = {
            vendorId: 'vendor1',
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'transactionDate',
        };

        const endOfDay = new Date(params.to);
        endOfDay.setDate(endOfDay.getDate() + 1);
        endOfDay.setHours(0, 0, 0, 0);

        const expectedWhereClause = {
            transactionDate: {
                [Op.between]: [params.from, endOfDay],
            },
            [Op.or]: [
                { id: { [Op.like]: `%${params.searchText}%` } },
                { corporateTxnId: { [Op.like]: `%${params.searchText}%` } },
                { debitAmount: { [Op.like]: `%${params.searchText}%` } },
                { creditAmount: { [Op.like]: `%${params.searchText}%` } },
                { corporateCashback: { [Op.like]: `%${params.searchText}%` } },
                { systemCashback: { [Op.like]: `%${params.searchText}%` } },
                { balance: { [Op.like]: `%${params.searchText}%` } },
                { remarks: { [Op.like]: `%${params.searchText}%` } },
                { '$serviceOperator.serviceProvider$': { [Op.like]: `%${params.searchText}%` } },
                { '$serviceOperator.vendor.vendorName$': { [Op.like]: `%${params.searchText}%` } },
                { '$credential.name$': { [Op.like]: `%${params.searchText}%` } },
                { '$credential.username$': { [Op.like]: `%${params.searchText}%` } },
            ],
        };

        if (params.vendorId) {
            expectedWhereClause[Op.or].push({
                '$serviceOperator.vendorId$': params.vendorId
            });
        }

        const expectedOrder = [['transactionDate', 'ASC']];
        const mockResult = { count: 1, rows: [] };

        transaction.findAndCountAll.mockResolvedValue(mockResult);
        handleSortFields.mockReturnValue(expectedOrder);

        // Act
        const result = await findAllVendorTransactions(params);

        // Debug actual call arguments
        console.log('Actual call arguments:', transaction.findAndCountAll.mock.calls[0][0]);

        // Assert
        expect(transaction.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
              attributes: ["createdAt", "transactionDate", "corporateTxnId", "debitAmount", "status", "remarks"],
              include: expect.arrayContaining([
                expect.objectContaining({
                  model: serviceOperator,
                  attributes: ["vendorId", "serviceProvider"],
                  include: expect.arrayContaining([
                    expect.objectContaining({
                      model: vendor,
                      attributes: ["vendorName"],
                    }),
                  ]),
                }),
                expect.objectContaining({
                  model: credential,
                  attributes: ["username", "name"],
                  include: expect.arrayContaining([
                    expect.objectContaining({
                      model: credential,
                      as: "registeredByCredential",
                      attributes: ["name"],
                    }),
                  ]),
                }),
                expect.objectContaining({
                  model: orders,
                  attributes: ["orderResponse", "amountInINR"],
                }),
              ]),
              where: expect.objectContaining({
                transactionDate: expect.objectContaining({
                  [Op.between]: expect.any(Array),
                }),
                [Op.or]: expect.any(Array),
                "$serviceOperator.vendorId$": expect.any(String),
              }),
              order: [["transactionDate", "ASC"]],
              limit: 10,
              offset: 0,
              raw: true,
              nest: true,
            })
          );
          
          

          

        expect(result).toEqual(mockResult);
    });

    it('should apply the correct sorting when sortField and sort are provided', async () => {
      const mockResponse = {
        count: 2,
        rows: [
          {
            createdAt: '2025-01-01',
            transactionDate: '2025-01-01',
            corporateTxnId: '123',
            debitAmount: 100,
            status: 'Success',
            remarks: 'Test remark 1',
          },
          {
            createdAt: '2025-01-02',
            transactionDate: '2025-01-02',
            corporateTxnId: '124',
            debitAmount: 200,
            status: 'Failure',
            remarks: 'Test remark 2',
          },
        ],
      };
  
      // Mocking the response for transactions
      transaction.findAndCountAll.mockResolvedValue(mockResponse);
  
      const result = await findAllVendorTransactions(mockParams);
  
      // Check if sorting logic is applied as expected
      expect(result).toEqual(mockResponse);
      expect(transaction.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['transactionDate', 'ASC']],  // Sorting applied
        })
      );
    });
});
