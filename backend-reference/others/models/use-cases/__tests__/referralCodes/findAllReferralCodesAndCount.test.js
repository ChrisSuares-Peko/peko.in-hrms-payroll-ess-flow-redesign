const { findAllReferralCodesAndCount } = require('../../../use-cases/referral_codes');
const sequelizeConfig = require('../../../../configs/database/index');



describe('findAllReferralCodesAndCount', () => {
  const mockParams = {
    searchText: 'test',
    sortField: 'id',
    sort: 'ASC',
    limit: 10,
    offset: 0,
  };

  const mockDataResponse = [
    {
      id: 1,
      referralCode: 'REF123',
      contactPersonName: 'John Doe',
      contactPersonPhone: '1234567890',
      partnerName: 'Partner Company',
    },
  ];

  const mockCountResponse = [{ totalCount: 1 }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return referral codes and count successfully', async () => {
    sequelizeConfig.query
      .mockResolvedValueOnce(mockDataResponse) // Mock first query (dataQuery)
      .mockResolvedValueOnce(mockCountResponse); // Mock second query (totalCountQuery)

    const result = await findAllReferralCodesAndCount(mockParams);

    expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
    expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), {
      replacements: expect.objectContaining({
        searchText: mockParams.searchText,
        limit: mockParams.limit,
        offset: mockParams.offset,
      }),
      type: 'SELECT',
    });

    expect(result).toEqual({
      rows: mockDataResponse,
      count: 1,
    });
  });

  it('should return false if a database error occurs', async () => {
    sequelizeConfig.query.mockRejectedValue(new Error('Database error'));

    const result = await findAllReferralCodesAndCount(mockParams);

    expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
    expect(result).toBe(false);
  });
});
