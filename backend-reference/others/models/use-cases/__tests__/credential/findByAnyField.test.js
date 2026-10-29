const { findByAnyField }= require('../../credential'); 
const credential = require('../../../entities/credential'); 

jest.mock('../../../entities/credential', () => ({
    findOne: jest.fn(),
}));

describe('findByAnyField', () => {
    it('should successfully find a credential based on the provided query', async () => {
        const query = { username: 'testuser' };
        const mockFoundCredential = {
            id: 1,
            username: 'testuser',
            name: 'Test User',
        };

        credential.findOne.mockResolvedValue(mockFoundCredential);

        const result = await findByAnyField(query);

        expect(credential.findOne).toHaveBeenCalledWith({ where: query });
        expect(result).toEqual(mockFoundCredential);
    });

    it('should handle cases where no matching credential is found', async () => {
        const query = { email: 'nonexistent@example.com' };
        credential.findOne.mockResolvedValue(null);

        const result = await findByAnyField(query);

        expect(credential.findOne).toHaveBeenCalledWith({ where: query });
        expect(result).toBeNull(); 
    });

    it('should handle different query types (e.g., number)', async () => {
        const query = { id: 123 };
        const mockFoundCredential = {
            id: 123,
            username: 'anotheruser',
            name: 'Another User',
        };
        credential.findOne.mockResolvedValue(mockFoundCredential);

        const result = await findByAnyField(query);

        expect(credential.findOne).toHaveBeenCalledWith({ where: query });
        expect(result).toEqual(mockFoundCredential);
    });

    it('should handle empty query', async () => {
        const query = {};
        const mockFoundCredential = {
            id: 1,
            username: 'testuser',
            name: 'Test User',
        };
        credential.findOne.mockResolvedValue(mockFoundCredential);

        const result = await findByAnyField(query);

        expect(credential.findOne).toHaveBeenCalledWith({ where: query }); 
        expect(result).toEqual(mockFoundCredential); 
    });

    it('should handle errors during credential retrieval', async () => {
        const query = { username: 'testuser' };
        const mockError = new Error('Database error');
        credential.findOne.mockRejectedValue(mockError);
    
        const consoleLogSpy = jest.spyOn(console, 'log'); 
    
        await expect(findByAnyField(query)).rejects.toEqual(mockError);
    
        expect(credential.findOne).toHaveBeenCalledWith({ where: query });
        expect(consoleLogSpy).not.toHaveBeenCalled(); 
    });

});