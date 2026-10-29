const { findAll } = require('../../../use-cases/softwares_subscriptions_plans'); 
const softwares_subscriptions_plans = require('../../../entities/softwares_subscriptions_plans');  
const softwares_subscriptions = require('../../../entities/softwares_subscriptions'); 
const { Op } = require('sequelize'); 
const { handleSortFields } = require('../../../../utils/sortHandle'); 

jest.mock('../../../entities/softwares_subscriptions_plans'); 
jest.mock('../../../entities/softwares_subscriptions');  
jest.mock('../../../../utils/sortHandle');  
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('findAll function', () => {
  const mockParams = {
    limit: 10,
    offset: 0,
    searchText: 'test',
    sort: 'asc',
    sortField: 'name',
  };

  const mockAttributes = ['id', 'name', 'monthlyPrice', 'yearlyPrice']; 
  
  const mockResult = {
    count: 2,
    rows: [
      { id: 1, name: 'Test Plan 1', monthlyPrice: 100, yearlyPrice: 1000, softwares_subscription: { name: 'Software 1', type: 'type1' } },
      { id: 2, name: 'Test Plan 2', monthlyPrice: 200, yearlyPrice: 2000, softwares_subscription: { name: 'Software 2', type: 'type2' } },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();  
  });

  it('should return a list of plans with proper search and sorting', async () => {
    handleSortFields.mockReturnValue([['name', 'ASC']]);  
    softwares_subscriptions_plans.findAndCountAll.mockResolvedValue(mockResult);  

    const result = await findAll(mockParams, undefined, mockAttributes);

    expect(softwares_subscriptions_plans.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: softwares_subscriptions,
          attributes: ['name', 'type'],
        },
      ],
      attributes: mockAttributes,
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%test%' } },
          { name: { [Op.like]: '%test%' } },
          { monthlyPrice: { [Op.like]: '%test%' } },
          { yearlyPrice: { [Op.like]: '%test%' } },
          { descriptions: { [Op.like]: '%test%' } },
          { '$softwares_subscription.name$': { [Op.like]: '%test%' } },
        ],
      },
      order: [['name', 'ASC']],
      limit: mockParams.limit,
      offset: mockParams.offset,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult); 
  });

  it('should filter by status if provided', async () => {
    handleSortFields.mockReturnValue([['name', 'ASC']]);  
    const mockStatus = 'active';
    const mockFilteredResult = { ...mockResult, count: 1 };  
    softwares_subscriptions_plans.findAndCountAll.mockResolvedValue(mockFilteredResult);

    const result = await findAll(mockParams, mockStatus, mockAttributes);

    expect(softwares_subscriptions_plans.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: mockStatus,
        }),
      })
    );

    expect(result).toEqual(mockFilteredResult);  
  });

  it('should throw an error and log it if something goes wrong', async () => {
    const mockError = new Error('Test error');
    softwares_subscriptions_plans.findAndCountAll.mockRejectedValue(mockError); 
    console.log = jest.fn(); 
    await expect(findAll(mockParams, undefined, mockAttributes)).rejects.toEqual({ message: 'Something went wrong' });

    expect(console.log).toHaveBeenCalledWith(mockError);  
  });
});
