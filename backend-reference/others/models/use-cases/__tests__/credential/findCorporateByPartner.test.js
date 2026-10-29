const { findCorporateByPartner } = require('../../credential');
const credential = require('../../../entities/credential');
jest.mock('../../../entities/credential'); 

describe('findCorporateByPartner Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve corporate users by registeredBy', async () => {
    const registeredBy = 123;
    const mockCorporateData = [
      {
        email: 'test1@example.com',
        name: 'Test Corp 1',
        registeredBy: 123,
      },
      {
        email: 'test2@example.com',
        name: 'Test Corp 2',
        registeredBy: 123,
      },
    ];

    credential.findAll = jest.fn().mockResolvedValue(mockCorporateData);

    const result = await findCorporateByPartner(registeredBy);

    expect(result).toEqual(mockCorporateData);
    expect(credential.findAll).toHaveBeenCalledWith({
      where: {
        registeredBy: registeredBy,
      },
    });
  });

  it('should return an empty array when no corporate users are found', async () => {
    const registeredBy = 123;

    credential.findAll = jest.fn().mockResolvedValue([]);

    const result = await findCorporateByPartner(registeredBy);

    expect(result).toEqual([]);
    expect(credential.findAll).toHaveBeenCalledWith({
      where: {
        registeredBy: registeredBy,
      },
    });
  });

  it('should throw an error if the query fails', async () => {
    const registeredBy = 123;

    credential.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

    await expect(findCorporateByPartner(registeredBy)).rejects.toThrow('Database error');
  });
});
