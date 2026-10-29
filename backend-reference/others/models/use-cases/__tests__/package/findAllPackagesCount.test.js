const { findAllPackagesCount } = require('../../package')
const sequelizeConfig = require('../../../../configs/database/index')

jest.mock('../../../../configs/database/index', () => ({
     query: jest.fn(),
     define: jest.fn(),
}))
jest.mock('../../../entities/serviceOperator', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/cashback', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/credential', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/subCorporateUsers', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/order', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/transaction', () => ({
     belongsTo: jest.fn(),
}))

describe('find AllPackages Count', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

   
    
    

 it('should return zero count and empty rows if no records match the search criteria', async () => {
     const params = { limit: 10, offset: 0, searchText: 'nonexistent', sort: 'ASC', sortField: 'packageName' };
     const mockData = [];
     const mockCount = [{ totalCount: 0 }];

     sequelizeConfig.query.mockImplementation((query) => {
         if (query.includes('COUNT(*) AS totalCount')) {
             return Promise.resolve(mockCount);
         }
         return Promise.resolve(mockData);
     });

     const result = await findAllPackagesCount(params);

     expect(result).toEqual({
         rows: mockData,
         count: 0
     });
 });

    it('should return zero count and empty rows if no records match the search', async () => {
        const params = { limit: 10, offset: 0, searchText: 'nonexistent', sort: 'ASC', sortField: 'packageName' };
        const mockData = [];
        const mockCount = [{ totalCount: 0 }];

        sequelizeConfig.query.mockImplementation((query) => {
            if (query.includes('COUNT(*) AS totalCount')) {
                return Promise.resolve(mockCount);
            }
            return Promise.resolve(mockData);
        });

        const result = await findAllPackagesCount(params);

        expect(result).toEqual({
            rows: mockData,
            count: 0
        });
    });

  


    it('should handle errors thrown during data retrieval', async () => {
        const params = { limit: 10, offset: 0, searchText: 'test', sort: 'ASC', sortField: 'packageName' };
        const error = new Error('Database error');

        sequelizeConfig.query.mockRejectedValue(error);

        await expect(findAllPackagesCount(params)).rejects.toEqual({ message: 'Something went wrong' });
    });
});
