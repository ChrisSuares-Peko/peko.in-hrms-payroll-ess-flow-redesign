const { findAllKYBDetails } = require('../../../use-cases/vendorPayout/kybDetails'); 
const kybDetails = require('../../../entities/vendorPayout/kybDetails'); 
const credential = require('../../../entities/credential'); 
const { Op } = require('sequelize'); // Import Op
const { handleSortFields } = require('../../../../utils/sortHandle');  

jest.mock('../../../entities/vendorPayout/kybDetails', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));


describe('findAllKYBDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all KYB details with pagination, search, and sorting', async () => {
        const mockParams = {
            page: 1,
            itemsPerPage: 10,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'companyName',
            from: new Date('2024-01-01'),
            to: new Date('2024-01-31'),
        };
        const mockUserId = 1;
        const mockKYBDetails = {
            count: 2,
            rows: [
                {
                    id: 1,
                    companyName: 'Test Company 1',
                    contactPersonName: 'Test Person 1',
                    offEmail: 'test1@example.com',
                    status: 'ACTIVE',
                    credentialId: 1,
                    credential: { id: 1, name: 'testuser1', username: 'testuser1' },
                },
                {
                    id: 2,
                    companyName: 'Another Company',
                    contactPersonName: 'Another Person',
                    offEmail: 'test2@example.com',
                    status: 'PENDING',
                    credentialId: 1,
                    credential: { id: 1, name: 'testuser1', username: 'testuser1' },
                },
            ],
        };

        handleSortFields.mockReturnValue([['companyName', 'ASC']]); // Mock the sort function
        kybDetails.findAndCountAll.mockResolvedValue(mockKYBDetails);

        const result = await findAllKYBDetails(mockParams, mockUserId);

        expect(handleSortFields).toHaveBeenCalledWith('companyName', 'ASC');
        const call = kybDetails.findAndCountAll.mock.calls[0][0];
        expect(call.include).toEqual([{
            model: credential,
            attributes: ['id', 'name', 'username']
        }]);
        expect(call.where.credentialId).toBe(1);
        expect(call.where.createdAt).toBeDefined();
        expect(call.where[Op.or]).toEqual([
            { companyName: { [Op.like]: '%test%' } },
            { contactPersonName: { [Op.like]: '%test%' } },
            { offEmail: { [Op.like]: '%test%' } },
            { status: { [Op.like]: '%test%' } },
            { '$credential.username$': { [Op.like]: '%test%' } },
        ]);
        expect(call.order).toEqual([['companyName', 'ASC']]);
        expect(call.limit).toBe(10);
        expect(call.offset).toBe(0);
        expect(call.raw).toBe(true);
        expect(call.nest).toBe(true);
        expect(result).toEqual(mockKYBDetails);
    });

    it('should handle cases where no KYB details are found', async () => {
        const mockParams = { /* ... */ };
        const mockUserId = 1;
        const mockKYBDetails = { count: 0, rows: [] };

        handleSortFields.mockReturnValue([['companyName', 'ASC']]);
        kybDetails.findAndCountAll.mockResolvedValue(mockKYBDetails);

        const result = await findAllKYBDetails(mockParams, mockUserId);

        expect(result).toEqual(mockKYBDetails);
    });

    it('should handle errors during database operations', async () => {
        const mockParams = { /* ... */ };
        const mockUserId = 1;
        const mockError = new Error('Database error');

        kybDetails.findAndCountAll.mockRejectedValue(mockError);

        const result = await findAllKYBDetails(mockParams, mockUserId);

        expect(result).toEqual({ success: false, message: mockError.message });
    });

    it('should handle cases where userId is not provided', async () => {
      const mockParams = {
        page: 1,
        itemsPerPage: 10,
        searchText: 'test',
        sort: 'ASC',
        sortField: 'companyName',
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
    };
    const mockKYBDetails = { /* ... */ }; // Mock data

    handleSortFields.mockReturnValue([['companyName', 'ASC']]);
    kybDetails.findAndCountAll.mockResolvedValue(mockKYBDetails);
      const result = await findAllKYBDetails(mockParams);

      const call = kybDetails.findAndCountAll.mock.calls[0][0];
      expect(call.include).toEqual([{
          model: credential,
          attributes: ['id', 'name', 'username']
      }]);
      expect(call.where.credentialId).toBeUndefined();
      expect(call.where.createdAt).toBeDefined();
      expect(call.where[Op.or]).toEqual([
          { companyName: { [Op.like]: '%test%' } },
          { contactPersonName: { [Op.like]: '%test%' } },
          { offEmail: { [Op.like]: '%test%' } },
          { status: { [Op.like]: '%test%' } },
          { '$credential.username$': { [Op.like]: '%test%' } },
      ]);
      expect(call.order).toEqual([['companyName', 'ASC']]);
      expect(call.limit).toBe(10);
      expect(call.offset).toBe(0);
      expect(call.raw).toBe(true);
      expect(call.nest).toBe(true);
      expect(result).toEqual(mockKYBDetails);
  });
});