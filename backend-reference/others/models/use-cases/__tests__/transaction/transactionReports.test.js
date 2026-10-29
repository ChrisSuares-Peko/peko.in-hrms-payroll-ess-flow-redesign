const sequelizeConfig = require('../../../../configs/database/index');
const { transactionReports } = require('../../transaction');

jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../configs/database/index', () => {
  return {
    query: jest.fn(),
    define: jest.fn(),
    QueryTypes: {
      SELECT: 'SELECT',
    },
  };
});
jest.mock('../../../entities/serviceOperator', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/credential', () => {
  return {
    prototype: {
      getResetPasswordToken: jest.fn().mockReturnValue({
        resetToken: 'REDACTED',
        resetPasswordToken: 'REDACTED',
        resetPasswordExpire: Date.now() + 10 * 60 * 1000,
      }),
    },
  };
});

describe('transactionReports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return data from the database', async () => {
    // Arrange
    const params = {
      credentialId: '12345',
      from: '2024-01-01',
      to: '2024-01-31',
    };
  
    const mockData = [
      { id: 1, reportDetail: 'Report 1' },
      { id: 2, reportDetail: 'Report 2' },
    ];
  
    sequelizeConfig.query.mockResolvedValue(mockData);
  
    // Act
    const result = await transactionReports(params);
  
    // Assert
    expect(result).toEqual(mockData);
    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      expect.stringContaining('select * from reportAll'),
      expect.objectContaining({
        replacements: [params.from, params.to],
        type: sequelizeConfig.QueryTypes.SELECT,
      })
    );
  });
  
  it('should throw an error if the query fails', async () => {
    // Arrange
    const params = {
      credentialId: '12345',
      from: '2024-01-01',
      to: '2024-01-31',
    };
  
    sequelizeConfig.query.mockRejectedValue(new Error('Database error'));
  
    // Act & Assert
    await expect(transactionReports(params)).rejects.toThrow('Database error');
  });
  
  
  it('should handle missing parameters gracefully', async () => {
    // Arrange
    const params = {
      from: '2024-01-01',
      to: '2024-01-31',
    };
  
    const mockData = [];
  
    sequelizeConfig.query.mockResolvedValue(mockData);
  
    // Act
    const result = await transactionReports(params);
  
    // Assert
    expect(result).toEqual([]);
    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      expect.stringContaining('select * from reportAll'),
      expect.objectContaining({
        replacements: [params.from, params.to],
        type: sequelizeConfig.QueryTypes.SELECT,
      })
    );
  });
  
  it('should return an empty array if no data is found', async () => {
    // Arrange
    const params = {
      credentialId: '12345',
      from: '2024-01-01',
      to: '2024-01-31',
    };
  
    const mockData = [];
  
    sequelizeConfig.query.mockResolvedValue(mockData);
  
    // Act
    const result = await transactionReports(params);
  
    // Assert
    expect(result).toEqual([]);
  });
});
