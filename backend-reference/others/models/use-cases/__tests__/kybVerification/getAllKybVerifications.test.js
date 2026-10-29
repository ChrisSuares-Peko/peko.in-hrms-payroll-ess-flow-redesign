const { getAllKybVerifications } = require('../../kybVerification');
const kybVerification = require('../../../entities/kybVerification');
const corporateUser = require('../../../entities/corporateUser');
const { Op } = require('sequelize');

jest.mock('../../../entities/kybVerification');
jest.mock('../../../entities/corporateUser');


describe('getAllKybVerifications', () => {
  beforeEach(() => {
    kybVerification.findAndCountAll.mockClear();
    corporateUser.findAll.mockClear();
  });

  it('should return KYB verifications with attached corporate user data', async () => {
    const mockKybData = {
      count: 1,
      rows: [
        {
          corporateUserId: 1,
          documentType: 'gst',
          toJSON: () => ({
            corporateUserId: 1,
            documentType: 'gst',
          }),
        },
      ],
    };
  
    const mockCorporateData = [
      {
        id: 1,
        gstVerified: true,
        panVerified: false,
      },
    ];
  
    kybVerification.findAndCountAll.mockResolvedValue(mockKybData);
    corporateUser.findAll.mockResolvedValue(mockCorporateData);
  
    const params = {
      limit: 10,
      offset: 0,
      from: '2022-01-01',
      to: '2022-12-31',
      searchText: 'business',
      column: 'createdAt',
      sort: 'desc',
    };
  
    const result = await getAllKybVerifications(params);
  
    expect(result.count).toBe(1);
    expect(result.rows[0].gstVerified).toBe(true);
    expect(result.rows[0].panVerified).toBe(undefined); // Expect undefined for panVerified, not null
    expect(kybVerification.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { documentNumber: { [Op.like]: '%business%' } },
          { legalNameOfBusiness: { [Op.like]: '%business%' } },
          { nameMatchingScore: { [Op.like]: '%business%' } },
        ],
        createdAt: { [Op.between]: [new Date('2022-01-01'), new Date('2022-12-31')] },
      },
      limit: 10,
      offset: 0,
      order: [['createdAt', 'DESC']],
    });
  });
  

  it('should handle error gracefully', async () => {
    kybVerification.findAndCountAll.mockRejectedValue(new Error('Database error'));

    const params = { limit: 10, offset: 0 };

    await expect(getAllKybVerifications(params)).rejects.toThrow('Error fetching KYB verifications: Database error');
  });
});
