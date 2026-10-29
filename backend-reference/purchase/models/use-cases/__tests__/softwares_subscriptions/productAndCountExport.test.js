const { productAndCountExport } = require('../../../use-cases/softwares_subscriptions');
const softwares_subscriptions = require('../../../entities/softwares_subscriptions');
const vendors = require('../../../entities/vendor');
const { Op } = require('sequelize');

// Mock the necessary modules
jest.mock('../../../entities/softwares_subscriptions');
jest.mock('../../../entities/vendor');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));

describe('productAndCountExport function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve products and format data correctly', async () => {
    const mockParams = { searchText: 'test', sort: 'ASC', sortField: 'name' };
    const mockOrder = [['name', 'ASC']];
    const mockData = {
      count: 1,
      rows: [
        {
          id: 1,
          name: 'Test Product',
          image: 'test.jpg',
          offersText: 'Special offer',
          type: 'Basic',
          status: 1,
          createdAt: new Date(),
          // displayOrder is not provided so it should be treated as not available
          displayOrder: undefined,
        },
      ],
    };

    // Mock the findAndCountAll method
    softwares_subscriptions.findAndCountAll.mockResolvedValue(mockData);

    const result = await productAndCountExport(mockParams);

    expect(softwares_subscriptions.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            model: vendors,
            attributes: expect.arrayContaining(["vendorName", "optional1"]),
          }),
        ]),
        where: expect.objectContaining({
          [Op.or]: expect.arrayContaining([
            expect.objectContaining({ id: expect.objectContaining({ [Op.like]: "%test%" }) }),
            expect.objectContaining({ type: expect.objectContaining({ [Op.like]: "%test%" }) }),
            expect.objectContaining({ name: expect.objectContaining({ [Op.like]: "%test%" }) }),
            expect.objectContaining({ offersText: expect.objectContaining({ [Op.like]: "%test%" }) }),
            expect.objectContaining({ peko_key: expect.objectContaining({ [Op.like]: "%test%" }) }),
            expect.objectContaining({ pekoEmail: expect.objectContaining({ [Op.like]: "%test%" }) }),
            expect.objectContaining({ displayOrder: expect.objectContaining({ [Op.like]: "%test%" }) }),
          ]),
        }),
        order: mockOrder,
        raw: true,
        nest: true,
      })
    );
    
    

    expect(result).toEqual([
      {
        Date: expect.any(String), // Expect formatted date string
        Name: 'Test Product',
        Type: 'Basic',
        Offers: 'Special offer',
        "Display Order": "Not Available", // because displayOrder is undefined in mockData
        Image: 'test.jpg',
        Status: 'Active',
      },
    ]);
  });

  it('should handle errors and throw a message', async () => {
    const mockParams = { searchText: 'test', sort: 'ASC', sortField: 'name' };
    const mockError = new Error('Something went wrong');

    // Simulate a rejection from findAndCountAll.
    softwares_subscriptions.findAndCountAll.mockRejectedValue(mockError);

    await expect(productAndCountExport(mockParams)).rejects.toEqual({ message: 'Something went wrong' });
  });
});
