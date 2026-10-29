const { deleteBonus } = require('../../bonus');
const Bonus = require('../../../entities/bonus');

jest.mock('../../../entities/bonus', () => ({
  findOneAndDelete: jest.fn(),
}));

describe('Bonus Use-Cases - deleteBonus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete the bonus and return the deleted data', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      bonusId: 'bonusId',
    };
    const expectedDeletedResult = { _id: 'bonusId', bonusAmount: 500 };

    Bonus.findOneAndDelete.mockResolvedValue(expectedDeletedResult);

    const result = await deleteBonus(params);

    expect(Bonus.findOneAndDelete).toHaveBeenCalledWith({
      _id: params.bonusId,
      corporateUser: params.corporateUserID,
    });
    expect(result).toEqual(expectedDeletedResult);
  });

  it('should return an error if the findOneAndDelete method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      bonusId: 'bonusId',
    };
    const expectedError = new Error('Database error');

    Bonus.findOneAndDelete.mockRejectedValue(expectedError);

    const result = await deleteBonus(params);

    expect(Bonus.findOneAndDelete).toHaveBeenCalledWith({
      _id: params.bonusId,
      corporateUser: params.corporateUserID,
    });
    expect(result).toBe(expectedError);
  });
});
