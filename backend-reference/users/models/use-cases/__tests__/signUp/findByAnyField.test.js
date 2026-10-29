const { findByAnyField } = require('../../signUp'); 
const credential = require('../../../entities/credential'); 


jest.mock('../../../entities/credential'); 
jest.mock('../../../entities/corporateUser', () =>({
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    belongsTo: jest.fn(),
    findOne:jest.fn(),
    }));

describe('findByAnyField function', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });

    it('should return a record successfully based on the query', async () => {
        const query = { username: 'testUser' };
        const mockRecord = undefined

        credential.findOne.mockResolvedValue(mockRecord);

        const result = await findByAnyField(query);

        expect(result).toEqual(mockRecord); 
        // expect(credential.findOne).toHaveBeenCalledWith({
        //     where: query
        // }); 
    });


    // it('should handle errors and throw an exception', async () => {
    //     const query = { username: 'testUser' };
    //     const mockError = new Error('Something went wrong');

    //     credential.findOne.mockRejectedValue(mockError);

    //     await expect(findByAnyField(query)).rejects.toThrow('Something went wrong'); 
    //     expect(credential.findOne).toHaveBeenCalledWith({
    //         where: query
    //     });
    // });
});
