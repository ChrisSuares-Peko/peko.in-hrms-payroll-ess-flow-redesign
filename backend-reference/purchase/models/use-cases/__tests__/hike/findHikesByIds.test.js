const { Op } = require('sequelize');
const { findHikesByIds } = require('../../hike');
const hike = require('../../../entities/hike');

jest.mock('../../../entities/hike');

jest.mock('../../../entities/subCorporateUsers', () => ({
  hasOne: jest.fn(),
  belongsTo: jest.fn(),
}));

describe('findHikesByIds', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('looks the hikes up by id with the fields the journal needs', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    hike.findAll.mockResolvedValue(rows);

    const result = await findHikesByIds([1, 2]);

    expect(hike.findAll).toHaveBeenCalledWith({
      where: { id: { [Op.in]: [1, 2] } },
      attributes: [
        'id',
        'name',
        'amount',
        'commissionMode',
        'commissionType',
        'commission',
        'fixedCommissionPerTransaction',
        'isCommissionInclGST',
      ],
    });
    expect(result).toEqual(rows);
  });
});
