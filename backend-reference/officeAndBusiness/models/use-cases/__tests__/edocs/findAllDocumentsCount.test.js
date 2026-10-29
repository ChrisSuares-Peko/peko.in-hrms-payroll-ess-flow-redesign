const { findAllDocumentsCount } = require('../../edocs');
const edocs = require('../../../entities/edocs');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { Op } = require('sequelize');

// Mock dependencies
jest.mock('../../../entities/edocs');
jest.mock('../../../../utils/sortHandle');

describe('findAllDocumentsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return data with default query options', async () => {
    const mockData = {
      rows: [
        { id: 1, documentName: 'Test Doc', category: { id: 1, categoryName: 'Test Category' } },
      ],
      count: 1,
    };

    edocs.findAndCountAll.mockResolvedValue(mockData);
    handleSortFields.mockReturnValue([['createdAt', 'ASC']]);

    const params = {
      page: 1,
      itemsPerPage: 10,
      searchText: '',
      sort: 'ASC',
      sortField: 'createdAt',
    };

    const result = await findAllDocumentsCount(params);

    expect(handleSortFields).toHaveBeenCalledWith('createdAt', 'ASC');
    expect(edocs.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: expect.anything(),
          attributes: ['id', 'categoryName'],
        },
      ],
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%%' } },
          { documentName: { [Op.like]: '%%' } },
          { description: { [Op.like]: '%%' } },
          { '$category.categoryName$': { [Op.like]: '%%' } },
        ],
      },
      order: [['createdAt', 'ASC']],
      limit: 10,
      offset: 0, // (page - 1) * itemsPerPage = (1 - 1) * 10 = 0
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockData);
  });

  it('should filter data based on searchText', async () => {
    const mockData = {
      rows: [
        { id: 1, documentName: 'Test Document', category: { id: 1, categoryName: 'Category 1' } },
      ],
      count: 1,
    };

    edocs.findAndCountAll.mockResolvedValue(mockData);

    const params = {
      page: 1,
      itemsPerPage: 10,
      searchText: 'Test',
      sort: 'ASC',
      sortField: 'createdAt',
    };

    const result = await findAllDocumentsCount(params);

    expect(edocs.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          [Op.or]: [
            { id: { [Op.like]: '%Test%' } },
            { documentName: { [Op.like]: '%Test%' } },
            { description: { [Op.like]: '%Test%' } },
            { '$category.categoryName$': { [Op.like]: '%Test%' } },
          ],
        },
      })
    );

    expect(result).toEqual(mockData);
  });

  it('should apply sorting based on sortField and sort order', async () => {
    const mockData = {
      rows: [
        { id: 1, documentName: 'A Document', category: { id: 1, categoryName: 'Category 1' } },
      ],
      count: 1,
    };

    edocs.findAndCountAll.mockResolvedValue(mockData);
    handleSortFields.mockReturnValue([['documentName', 'DESC']]);

    const params = {
      page: 1,
      itemsPerPage: 10,
      searchText: '',
      sort: 'DESC',
      sortField: 'documentName',
    };

    const result = await findAllDocumentsCount(params);

    expect(handleSortFields).toHaveBeenCalledWith('documentName', 'DESC');
    expect(edocs.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['documentName', 'DESC']],
      })
    );

    expect(result).toEqual(mockData);
  });

  it('should paginate data using page and itemsPerPage', async () => {
    const mockData = {
      rows: [
        { id: 2, documentName: 'Another Document', category: { id: 2, categoryName: 'Category 2' } },
      ],
      count: 1,
    };

    edocs.findAndCountAll.mockResolvedValue(mockData);

    // For page 3 with itemsPerPage 5, offset = (3-1)*5 = 10.
    const params = {
      page: 3,
      itemsPerPage: 5,
      searchText: '',
      sort: 'ASC',
      sortField: 'createdAt',
    };

    const result = await findAllDocumentsCount(params);

    expect(edocs.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5,
        offset: 10,
      })
    );

    expect(result).toEqual(mockData);
  });
});
