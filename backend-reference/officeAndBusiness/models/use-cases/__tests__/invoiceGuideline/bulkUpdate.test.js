const { bulkUpdate } = require('../../invoiceGuideline'); // Adjust the path
const guidelineModel = require('../../../entities/invoiceGuideline'); // Adjust the path
const sequelize = require('../../../../configs/database/index');

// Mock models and database methods
jest.mock('../../../entities/invoiceGuideline', () => ({
  belongsTo: jest.fn(),
  upsert: jest.fn(),
}));
jest.mock('../../../entities/invoices', () => ({
    belongsTo: jest.fn(),
  }));
  jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
  }));


jest.mock('../../../../configs/database/index', () => ({
    define: jest.fn(() => {
      const modelMock = {
        prototype: {},
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
      };
  
      return modelMock;
    }),
    transaction: jest.fn().mockImplementation((callback) => callback({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
  }));


describe('bulkUpdate Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully perform bulk upsert operations within a transaction', async () => {
    const mockParamsArray = [
      {
        id: 1,
        name: 'Test Guideline 1',
        description: 'Test description 1',
      },
      {
        id: 2,
        name: 'Test Guideline 2',
        description: 'Test description 2',
      },
    ];

    // Mock upsert to resolve successfully
    guidelineModel.upsert.mockResolvedValue([1]); // Simulate success response from upsert

    const result = await bulkUpdate(mockParamsArray);

    expect(sequelize.transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(guidelineModel.upsert).toHaveBeenCalledTimes(mockParamsArray.length);
    mockParamsArray.forEach((params) => {
      expect(guidelineModel.upsert).toHaveBeenCalledWith(params, { transaction: expect.any(Object) });
    });
    expect(result).toBe(true);
  });

  it('should handle errors during the bulk upsert operation and return false', async () => {
    const mockParamsArray = [
      {
        id: 1,
        name: 'Test Guideline 1',
        description: 'Test description 1',
      },
    ];

    // Mock upsert to reject with an error
    guidelineModel.upsert.mockRejectedValue(new Error("Failed to upsert guideline"));

    const result = await bulkUpdate(mockParamsArray);

    expect(sequelize.transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(guidelineModel.upsert).toHaveBeenCalledTimes(mockParamsArray.length);
    expect(result).toBe(false);
  });
});
