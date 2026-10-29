const { findSoftwares } = require('../../../use-cases/softwares');
const softwares  = require('../../../entities/softwares'); 
const category = require('../../../entities/categories');
const { Op } = require('sequelize');


jest.mock('../../../entities/softwares', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/categories');

describe('findSoftwares', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('should handle pagination correctly', async () => {
    const params = {
      searchText: '', 
      start: 2,
      length: 5,
      sort: 'oldest', // Sorting by createdAt for 'oldest'
    };
  
    const mockResult = {
      rows: [
        { id: 5, image: 'https://peko-storage.s3.me-central-1.amazonaws.com/staging/softwares/Recovery/xyz7890.png', name: 'Recovery Plus', discount: '25% off', description: 'Advanced recovery software for data protection and recovery.', createdAt: new Date(), sold_quantity: 5 },
        { id: 6, image: 'https://peko-storage.s3.me-central-1.amazonaws.com/staging/softwares/Utility/uvw6789.png', name: 'Utility Master', discount: '15% off', description: 'Comprehensive utility tool with a range of features for system optimization.', createdAt: new Date(), sold_quantity: 8 }
      ],
      count: 49
    };
  
    softwares.findAndCountAll.mockResolvedValue(mockResult);
  
    const result = await findSoftwares(params);
  
    // Check pagination and correct sorting (oldest)
    expect(softwares.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 5, 
        limit: 5, 
        order: [['createdAt', 'ASC']], // Sorting by createdAt for 'oldest'
      })
    );
  
    expect(result).toEqual({
      data: mockResult.rows,
      recordsTotal: mockResult.count,
      recordsFiltered: mockResult.count,
    });
  });

  it('should handle category filtering', async () => {
    const params = {
      searchText: '',
      start: 1,
      length: 10,
      sort: 'latest',
    };

    const mockResult = {
      rows: [
        {
          id: 1,
          name: 'Software A',
          createdAt: new Date(),
          sold_quantity: 10,
        },
      ],
      count: 1,
    };

    const categories = [1, 2];

    softwares.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findSoftwares(params, undefined, categories);

    expect(softwares.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          {
            model: category,
            where: { id: { [Op.in]: categories } },
            attributes: ['categoryName', 'id'],
          },
        ],
        where: {
          status: true,
        },
        order: [['createdAt', 'DESC']], // Sorting by createdAt for 'latest'
      })
    );

    expect(result).toEqual({
      data: mockResult.rows,
      recordsTotal: mockResult.count,
      recordsFiltered: mockResult.count,
    });
  });
  

  it('should handle category filter', async () => {
    const params = {
      searchText: '',
      start: 1,
      length: 10,
      sort: 'latest'
    };

    const mockResult = {
      rows: [
        {
          id: 1,
          name: 'Software A',
          createdAt: new Date(),
          sold_quantity: 10,
        },
      ],
      count: 1
    };

    const categories = [1, 2];

    softwares.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findSoftwares(params, undefined, categories);

    expect(softwares.findAndCountAll).toHaveBeenCalledWith({
      include: [{
        model: category,
        where: {
          id: {
            [Op.in]: categories
          }
        },
        attributes: ['categoryName', 'id']
      }],
      where: {
        status: true,
      },
      attributes: undefined,
      offset: 0,
      limit: 10,
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual({
      data: mockResult.rows,
      recordsTotal: mockResult.count,
      recordsFiltered: mockResult.count,
    });
  });

  it('should handle pagination', async () => {
    const params = {
      searchText: '', 
      start: 2,
      length: 5,
      sort: 'oldest'
    };
  
    const mockResult = {
      rows: [
        { id: 5, image: 'https://peko-storage.s3.me-central-1.amazonaws.com/staging/softwares/Recovery/xyz7890.png', name: 'Recovery Plus', discount: '25% off', description: 'Advanced recovery software for data protection and recovery.', createdAt: new Date(), sold_quantity: 5 },
        { id: 6, image: 'https://peko-storage.s3.me-central-1.amazonaws.com/staging/softwares/Utility/uvw6789.png', name: 'Utility Master', discount: '15% off', description: 'Comprehensive utility tool with a range of features for system optimization.', createdAt: new Date(), sold_quantity: 8 }
      ],
      count: 49
    };
  
    softwares.findAndCountAll.mockResolvedValue(mockResult);
  
    const result = await findSoftwares(params);
  
    expect(softwares.findAndCountAll).toHaveBeenCalledWith({
      include: [{
        model: category,
        where: {
          categoryStatus: true
        },
        attributes: ['categoryName', 'id']
      }],
      where: {
        status: true
      },
      attributes: undefined, 
      offset: 5, 
      limit: 5, 
      order: [['createdAt', 'ASC']], 
    });
    expect(result).toEqual({
      data: mockResult.rows,
      recordsTotal: mockResult.count,
      recordsFiltered: mockResult.count,
    });
  });
  

  it('should handle cases where no software records are found', async () => {
    const params = {
      searchText: '',
      start: 1,
      length: 10,
      sort: 'latest'
    };

    const mockResult = {
      rows: [],
      count: 0
    };

    softwares.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findSoftwares(params);

    expect(softwares.findAndCountAll).toHaveBeenCalledWith({
      include: [{
        model: category,
        where: {
          categoryStatus: true
        },
        attributes: ['categoryName', 'id']
      }],
      where: {
        status: true,
      },
      attributes: undefined,
      offset: 0,
      limit: 10,
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual({
      data: mockResult.rows,
      recordsTotal: mockResult.count,
      recordsFiltered: mockResult.count,
    });
  });
});
