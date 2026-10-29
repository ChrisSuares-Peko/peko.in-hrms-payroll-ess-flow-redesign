const disableService = require('../../../entities/disabledService');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const { findAll } = require('../../../use-cases/disableService'); 

const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/disabledService', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

describe('findAll service', () => {
    it('should return data with correct parameters', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'createdAt',
        };

        const mockData = {
            count: 2,
            rows: [
                {
                    id: 1,
                    serviceOperator: { serviceProvider: 'Provider A' },
                    credential: { name: 'Corporate A', username: 'userA', id: 101 },
                },
                {
                    id: 2,
                    serviceOperator: { serviceProvider: 'Provider B' },
                    credential: { name: 'Corporate B', username: 'userB', id: 102 },
                }
            ]
        };

        const expectedOrder = [['createdAt', 'ASC']];
        handleSortFields.mockReturnValue(expectedOrder);
        disableService.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAll(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
       expect(disableService.findAndCountAll).toHaveBeenCalledWith(
  expect.objectContaining({
    include: [
      expect.objectContaining({
        model: serviceOperator,
        attributes: ['serviceProvider'],
      }),
      expect.objectContaining({
        model: credential,
        attributes: ['name', 'username', 'id', 'subPartnerId', 'registeredBy'],
        include: [
          expect.objectContaining({
            model: credential,
            as: 'subPartner',
            attributes: ['id', 'name', 'username'],
          }),
          expect.objectContaining({
            model: credential,
            as: 'registeredByCredential',
            attributes: ['id', 'name', 'username'],
          })
        ]
      })
    ],
    where: expect.any(Object),
    order: expectedOrder,
    limit: 10,
    offset: 0,
    raw: true,
    nest: true,
  })
);

        expect(result).toEqual(mockData);
    });

    it('should throw an error if findAndCountAll fails', async () => {
        const mockParams = { limit: 10, offset: 0, searchText: 'test' };
        const mockError = new Error('Database error');

        disableService.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAll(mockParams)).rejects.toEqual({ message: 'Something went wrong' });
    });
});
