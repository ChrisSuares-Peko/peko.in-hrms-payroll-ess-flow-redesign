const { Op } = require('sequelize');
const cloud_usageHistories = require('../../../../entities/pekoCloud/cloud_usageHistories');
const cloud_employees = require('../../../../entities/pekoCloud/cloud_employees');
const ErrorResponse = require('../../../../../utils/error-response');
const { findAllUsageHistories } = require('../../cloud_fleetUsageHistories');

jest.mock('../../../../entities/pekoCloud/cloud_usageHistories', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
  belongsTo: jest.fn(),
}));

describe('findAllUsageHistories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve all usage histories with pagination, sorting, and filtering', async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = 'createdAt';
    const sort = 'DESC';
    const searchText = 'John';
    const fleetId = 1;
    const mockUsageHistories = {
      count: 5,
      rows: [
        {
          id: 1,
          usageCategory: 'Maintenance',
          assignDate: new Date(),
          returnDate: new Date(),
          returnStatus: 'Returned',
          remarks: 'Test remark',
          cloud_employee: {
            id: 1,
            employeeName: 'John Doe',
            employeeEmail: 'john.doe@example.com',
            department: 'Engineering',
          },
        },
      ],
    };

    cloud_usageHistories.findAndCountAll.mockResolvedValue(mockUsageHistories);

    const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText, fleetId);

    expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: ['id', 'employeeName', 'employeeEmail', 'department'],
        },
      ],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        [Op.or]: [
          { '$cloud_employee.employeeName$': { [Op.like]: `%${searchText}%` } },
          { '$cloud_employee.employeeEmail$': { [Op.like]: `%${searchText}%` } },
          { '$cloud_employee.department$': { [Op.like]: `%${searchText}%` } },
        ],
        cloudFleetId: fleetId,
        usageCategory: "FLEET",
      },
    });
    expect(result).toEqual({ success: true, data: mockUsageHistories });
  });

  it('should retrieve all usage histories without search text and fleetId', async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = 'createdAt';
    const sort = 'ASC';
    const searchText = '';
    const fleetId = null;
    const mockUsageHistories = {
      count: 3,
      rows: [
        {
          id: 2,
          usageCategory: 'Repair',
          assignDate: new Date(),
          returnDate: new Date(),
          returnStatus: 'Pending',
          remarks: 'Another test remark',
          cloud_employee: {
            id: 2,
            employeeName: 'Jane Smith',
            employeeEmail: 'jane.smith@example.com',
            department: 'HR',
          },
        },
      ],
    };

    cloud_usageHistories.findAndCountAll.mockResolvedValue(mockUsageHistories);

    const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText, fleetId);

    expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: ['id', 'employeeName', 'employeeEmail', 'department'],
        },
      ],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        usageCategory: "FLEET",
      },
    });
    expect(result).toEqual({ success: true, data: mockUsageHistories });
  });

  it('should handle cases where no usage histories are found', async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = 'createdAt';
    const sort = 'DESC';
    const searchText = 'NonExisting';
    const fleetId = 999;
    const mockUsageHistories = {
      count: 0,
      rows: [],
    };

    cloud_usageHistories.findAndCountAll.mockResolvedValue(mockUsageHistories);

    const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText, fleetId);

    expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: ['id', 'employeeName', 'employeeEmail', 'department'],
        },
      ],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        [Op.or]: [
          { '$cloud_employee.employeeName$': { [Op.like]: `%${searchText}%` } },
          { '$cloud_employee.employeeEmail$': { [Op.like]: `%${searchText}%` } },
          { '$cloud_employee.department$': { [Op.like]: `%${searchText}%` } },
        ],
        cloudFleetId: fleetId,
        usageCategory: "FLEET",
      },
    });
    expect(result).toEqual({ success: true, data: mockUsageHistories });
  });

  it('should handle database errors gracefully', async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = 'createdAt';
    const sort = 'DESC';
    const searchText = 'John';
    const fleetId = 1;

    cloud_usageHistories.findAndCountAll.mockRejectedValue(new Error('Database error'));

    const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText, fleetId);

    expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: ['id', 'employeeName', 'employeeEmail', 'department'],
        },
      ],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        [Op.or]: [
          { '$cloud_employee.employeeName$': { [Op.like]: `%${searchText}%` } },
          { '$cloud_employee.employeeEmail$': { [Op.like]: `%${searchText}%` } },
          { '$cloud_employee.department$': { [Op.like]: `%${searchText}%` } },
        ],
        cloudFleetId: fleetId,
        usageCategory: "FLEET",
      },
    });
    expect(result).toEqual(new ErrorResponse('Something went wrong, please try again later.', 500));
  });
});
