const { fetchSoftwareCategories } = require('../../softwares'); 
const category = require('../../../entities/categories');
const vendors = require('../../../entities/vendor');
const { Op } = require('sequelize');

jest.mock('../../../entities/categories', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/vendor', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/softwares', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
}));

describe('fetchSoftwareCategories Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch software categories with search text', async () => {
    const params = {
      searchText: 'Example Category'
    };

    const expectedCategories = [
      {
        id: 1,
        categoryName: 'Example Category',
        categoryStatus: true,
        vendor: {
          id: 2,
          vendorName: 'Vendor Name',
          type: 'SOFTWARE',
        }
      }
    ];

    category.findAll.mockResolvedValue(expectedCategories);

    const result = await fetchSoftwareCategories(params);

    // Update expected to match the actual structure from Sequelize
    expect(category.findAll).toHaveBeenCalledWith({
      include: [{
        model: vendors,
        attributes: ['id', 'vendorName', 'type'],
        where: {
          type: 'SOFTWARE'
        }
      }],
      where: {
        categoryStatus: true,
        categoryName: {
          [Op.like]: `%${params.searchText.trim()}%`,
        }
      }
    });
    expect(result).toEqual(expectedCategories);
  });


  it('should fetch software categories without search text', async () => {
    const params = {};

    const expectedCategories = [
      {
        id: 1,
        categoryName: 'Category Name',
        categoryStatus: true,
        vendor: {
          id: 2,
          vendorName: 'Vendor Name',
          type: 'SOFTWARE',
        }
      }
    ];

    category.findAll.mockResolvedValue(expectedCategories);

    const result = await fetchSoftwareCategories(params);

    expect(category.findAll).toHaveBeenCalledWith({
      include: [{
        model: vendors,
        attributes: ['id', 'vendorName', 'type'],
        where: {
          type: 'SOFTWARE'
        }
      }],
      where: {
        categoryStatus: true
      }
    });
    expect(result).toEqual(expectedCategories);
  });

  it('should handle errors and log them', async () => {
    const params = {
      searchText: 'Example'
    };
    const error = new Error('Database error');
    console.log = jest.fn(); // Mock console.log to avoid cluttering test output

    category.findAll.mockRejectedValue(error);

    const result = await fetchSoftwareCategories(params);

    // Update expected to match the actual structure from Sequelize
    expect(category.findAll).toHaveBeenCalledWith({
      include: [{
        model: vendors,
        attributes: ['id', 'vendorName', 'type'],
        where: {
          type: 'SOFTWARE'
        }
      }],
      where: {
        categoryStatus: true,
        categoryName: {
          [Op.like]: `%${params.searchText.trim()}%`,
        }
      }
    });
    expect(result).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(error);
    expect(console.log).toHaveBeenCalledWith("CATEGORY FIND ALL ROUTE CALLED");
  });
});
