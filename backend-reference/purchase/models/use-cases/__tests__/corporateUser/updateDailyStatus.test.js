const sequelize  = require('../../../../configs/database/index')
const { updateDailyStatus } = require('../../corporateUser')
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

describe('updateDailyStatus', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update the dailyReport status and return true', async () => {

    sequelize.query.mockResolvedValue([1]); 

    const result = await updateDailyStatus(1, true);

    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: 1, isActive: true },
        type: QueryTypes.UPDATE,
      }
    );
    expect(result).toBe(true);
  });

  it('should throw an error if the update fails', async () => {
    sequelize.query.mockRejectedValue(new Error('Database Error'));

    await expect(updateDailyStatus(1, true)).rejects.toThrow('Failed to update dailyStatus');

    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: 1, isActive: true },
        type: QueryTypes.UPDATE,
      }
    );
  });

  it('should correctly handle different isActive values', async () => {
    sequelize.query.mockResolvedValue([1]);
  
    await Promise.all([
      updateDailyStatus(1, true),
      updateDailyStatus(1, false),
    ]);
  
    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
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
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: 1, isActive: false },
        type: QueryTypes.UPDATE,
      }
    );
  });
  

  it('should handle invalid id values', async () => {
    sequelize.query.mockResolvedValue([0]); 
  
    await expect(updateDailyStatus(null, true)).resolves.toBe(true);
    await expect(updateDailyStatus(undefined, true)).resolves.toBe(true);
  
    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: null, isActive: true },
        type: QueryTypes.UPDATE,
      }
    );
  
    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: undefined, isActive: true },
        type: QueryTypes.UPDATE,
      }
    );
  });
  

  it('should correctly handle large id and isActive values', async () => {
    sequelize.query.mockResolvedValue([1]);

    await expect(updateDailyStatus(Number.MAX_SAFE_INTEGER, true)).resolves.toBe(true);
    await expect(updateDailyStatus(Number.MAX_SAFE_INTEGER, false)).resolves.toBe(true);

    expect(sequelize.query).toHaveBeenCalledWith(
      `
      UPDATE corporateUsers
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
      {
        replacements: { id: Number.MAX_SAFE_INTEGER, isActive: expect.any(Boolean) },
        type: QueryTypes.UPDATE,
      }
    );
  });
});