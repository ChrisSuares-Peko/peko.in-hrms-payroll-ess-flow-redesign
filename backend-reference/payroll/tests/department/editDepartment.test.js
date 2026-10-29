const { findExistingDepartment, editDepartment } = require('../../src/models/use-cases/department');
const Department = require('../../src/models/entities/department');
const departmentController = require('../../src/controller/department');
const ErrorResponse = require('../../src/utils/error-response');

// Mock the required functions
jest.mock('../../src/models/use-cases/department', () => ({
    findExistingDepartment: jest.fn(),
    editDepartment: jest.fn(),
  }));
jest.mock('../../src/models/entities/department', () => ({
  findOne: jest.fn(),
}));

describe('Department Controller - Edit Department', () => {
  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  it('should edit a department', async () => {
    const req = {
      user: { _id: 'corporateUserID' },
      params: { id: 'departmentId' },
      body: {
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department'
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    findExistingDepartment.mockResolvedValue(null);
    Department.findOne.mockResolvedValue({ departmentName: 'Old HR' });
    editDepartment.mockResolvedValue({
      departmentName: 'HR',
      departmentCode: 12345,
      description: 'HR Department'
    });

    await departmentController.editDepartment(req,res,next)

    
    expect(findExistingDepartment).toHaveBeenCalledWith('corporateUserID', { departmentName: 'HR', departmentCode: 12345, description: 'HR Department' }, 'departmentId');
    expect(Department.findOne).toHaveBeenCalledWith({
      _id: 'departmentId',
      corporateUser: 'corporateUserID',
    });
    expect(editDepartment).toHaveBeenCalledWith({
      corporateUserID: 'corporateUserID',
      departmentId: 'departmentId',
      editData: {
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department'
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      responseCode: '000',
      message: 'Department data updated successfully',
      data: {
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department'
      },
    });
  });

  it('should return error if department exists', async () => {
    const req = {
      user: { _id: 'corporateUserID' },
      params: { id: 'departmentId' },
      body: {
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department'
      },
    };
    const res = {};
    const next = jest.fn();

    findExistingDepartment.mockResolvedValue({ departmentName: 'HR' });

    await departmentController.editDepartment(req, res, next);

 
    expect(findExistingDepartment).toHaveBeenCalledWith('corporateUserID', { departmentName: 'HR', departmentCode: 12345, description: 'HR Department' }, 'departmentId');
    expect(next).toHaveBeenCalledWith(new ErrorResponse('Department name or department code already exists', 400));
  });
});
