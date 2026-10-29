const { findPeko } = require('../../peko_connect');
const peko_connect = require('../../../entities/peko_connect');

jest.mock('../../../entities/peko_connect', () => ({
    findAll: jest.fn(),
  }));
  
  describe('findPeko Use-Case', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should find and return all active peko records', async () => {
      const mockPekoRecords = [
        {
          id: 1,
          serviceProvider: 'Provider1',
          tagline: 'Tagline1',
          address: 'Address1',
          category: 'Category1',
          description: 'Description1',
          offerings: 'Offerings1',
          email: 'email1@example.com',
          website: 'website1.com',
          mobileNo: '1234567890',
          rewards: 'Rewards1',
          logo: 'Logo1',
          status: true,
          services: [],
        },
        {
          id: 2,
          serviceProvider: 'Provider2',
          tagline: 'Tagline2',
          address: 'Address2',
          category: 'Category2',
          description: 'Description2',
          offerings: 'Offerings2',
          email: 'email2@example.com',
          website: 'website2.com',
          mobileNo: '0987654321',
          rewards: 'Rewards2',
          logo: 'Logo2',
          status: true,
          services: [],
        }
      ];
  
      peko_connect.findAll.mockResolvedValue(mockPekoRecords);
  
      const result = await findPeko(['id', 'serviceProvider', 'status']);
  
      expect(peko_connect.findAll).toHaveBeenCalledWith({
        where: { status: true },
        attributes: ['id', 'serviceProvider', 'status']
      });
      expect(result).toEqual(mockPekoRecords);
    });
  
    it('should throw an error if the findAll method throws an error', async () => {
      const errorMessage = 'Something went wrong';
      peko_connect.findAll.mockRejectedValue(new Error(errorMessage));
  
      await expect(findPeko()).rejects.toThrow(errorMessage);
  
      expect(peko_connect.findAll).toHaveBeenCalledWith({
        where: { status: true },
        attributes: undefined
      });
    });
  });