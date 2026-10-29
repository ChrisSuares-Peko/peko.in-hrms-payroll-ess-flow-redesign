const corporateUser = require('../../../entities/corporateUser');
const wallets = require('../../../entities/wallet');
const credential = require('../../../entities/credential');
const access_codes = require('../../../entities/access_codes');
const { findAll } = require('../../corporateUser'); 

describe('findAll function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockError = new Error('findAndCountAll error');
  const mockWalletError = new Error('findAll error');
  const mockPartnerError = new Error('findAll error');
  const mockMerchantError = new Error('findAll error');

  mockError.message = 'findAndCountAll error';
  mockWalletError.message = 'findAll error';
  mockPartnerError.message = 'findAll error';
  mockMerchantError.message = 'findAll error';

 

  it('should handle errors from corporateUser.findAndCountAll', async () => {
    const params = {
      offset: 0,
      limit: 10,
      sort: 'ASC',
      sortField: 'id',
      searchText: '',
      partnerId: null,
      subPartnerId: null
    };

    jest.spyOn(corporateUser, 'findAndCountAll').mockRejectedValue(mockError);

    await expect(findAll(params)).rejects.toThrow('Database error');
  });

  
  it('should handle errors from credential.findAll for partners', async () => {
    const params = {
      offset: 0,
      limit: 10,
      sort: 'ASC',
      sortField: 'id',
      searchText: '',
      partnerId: null,
      subPartnerId: null
    };

    jest.spyOn(corporateUser, 'findAndCountAll').mockResolvedValue({
      rows: [{ credentialId: 1, credential: { registeredBy: 1, username: 'testuser' } }],
      count: 1
    });

    jest.spyOn(wallets, 'findAll').mockResolvedValue([{ credentialId: 1, balance: 100 }]);
    jest.spyOn(credential, 'findAll').mockRejectedValue(mockPartnerError);

    await expect(findAll(params)).rejects.toThrow('Something went wrong');
  });

  it('should handle errors from access_codes.findAll', async () => {
    const params = {
      offset: 0,
      limit: 10,
      sort: 'ASC',
      sortField: 'id',
      searchText: '',
      partnerId: null,
      subPartnerId: null
    };

    jest.spyOn(corporateUser, 'findAndCountAll').mockResolvedValue({
      rows: [{ credentialId: 1, credential: { registeredBy: 1, username: 'testuser' } }],
      count: 1
    });

    jest.spyOn(wallets, 'findAll').mockResolvedValue([{ credentialId: 1, balance: 100 }]);
    jest.spyOn(credential, 'findAll').mockResolvedValue([{ id: 1, name: 'PartnerName' }]);
    jest.spyOn(access_codes, 'findAll').mockRejectedValue(mockMerchantError);

    await expect(findAll(params)).rejects.toThrow('Something went wrong');
  });
  it('should handle "default" partnerId correctly', async () => {
    const params = {
      offset: 0,
      limit: 10,
      sort: 'ASC',
      sortField: 'id',
      searchText: 'test',
      partnerId: 'default',  // Edge case
      subPartnerId: null
    };
  
    jest.spyOn(corporateUser, 'findAndCountAll').mockResolvedValue({
      rows: [{ credentialId: 1, credential: { registeredBy: null, username: 'testuser' } }],
      count: 1
    });
  
    jest.spyOn(wallets, 'findAll').mockResolvedValue([{ credentialId: 1, balance: 100 }]);
    jest.spyOn(credential, 'findAll').mockResolvedValue([{ id: 1, name: 'PartnerName' }]);
    jest.spyOn(access_codes, 'findAll').mockResolvedValue([{ corporateUserId: 1, access_code: 'merchant123' }]);
  
    const result = await findAll(params);
    expect(result.rows[0].credential.registeredBy).toBeNull();  // Ensure registeredBy is null
  });
  it('should handle empty result set', async () => {
    const params = {
      offset: 0,
      limit: 10,
      sort: 'ASC',
      sortField: 'id',
      searchText: 'nonexistent',
      partnerId: null,
      subPartnerId: null
    };
  
    const mockEmptyResult = { rows: [], count: 0 };
  
    jest.spyOn(corporateUser, 'findAndCountAll').mockResolvedValue(mockEmptyResult);
  
    const result = await findAll(params);
    expect(result.rows).toHaveLength(0);  // Ensure there are no rows
    expect(result.count).toBe(0);  // Ensure the count is zero
  });
  
});
