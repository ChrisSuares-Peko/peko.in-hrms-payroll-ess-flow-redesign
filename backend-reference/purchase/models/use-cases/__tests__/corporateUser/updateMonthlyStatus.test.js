const sequelize  = require('../../../../configs/database/index')
const { updateMonthlyStatus } = require('../../corporateUser')
const { QueryTypes } = require('sequelize')

jest.mock('../../../entities/credential', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/subscription', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/corporateUser', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/wallet', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/package', () => ({
     belongsTo: jest.fn(),
}))

jest.mock('../../../../configs/database/index', () => ({
    query: jest.fn(),
}));


describe('updateMonthlyStatus', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update the monthlyReport status and return true', async () => {
    sequelize.query.mockResolvedValue([1]); 

    const result = await updateMonthlyStatus(1, true);

    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET monthlyReport = JSON_SET(monthlyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: 1, isActive: true },
        type: QueryTypes.UPDATE,
      }
    );
    expect(result).toBe(true);
  });

  it('should handle invalid id values and resolve successfully', async () => {
    sequelize.query.mockResolvedValue([0]); 

    await expect(updateMonthlyStatus(null, true)).resolves.toBe(true);
    await expect(updateMonthlyStatus(undefined, true)).resolves.toBe(true);
    await expect(updateMonthlyStatus('string', true)).resolves.toBe(true);
  });

  it('should correctly handle different isActive values', async () => {
    sequelize.query.mockResolvedValue([1]); 

    await Promise.all([
      updateMonthlyStatus(1, true),
      updateMonthlyStatus(1, false),
    ]);

    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET monthlyReport = JSON_SET(monthlyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: 1, isActive: true },
        type: QueryTypes.UPDATE,
      }
    );

    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET monthlyReport = JSON_SET(monthlyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: 1, isActive: false },
        type: QueryTypes.UPDATE,
      }
    );
  });

  it('should resolve successfully even if no rows are updated', async () => {
    sequelize.query.mockResolvedValue([0]); 

    await expect(updateMonthlyStatus(1, true)).resolves.toBe(true);
  });
});