const {
    createDepartment,
    findDepartment,
  } = require('../../src/models/use-cases/department');
  const departmentController = require('../../src/controller/department');
  const ErrorResponse = require('../../src/utils/error-response');
  
  // Mock the required functions
  jest.mock('../../src/models/use-cases/department');
  
  describe('Department Controller - Create Department', () => {
    it('should create a new department', async () => {
      const req = {
        user: { _id: 'corporateUserID' },
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
  
      findDepartment.mockResolvedValue(null);
      createDepartment.mockResolvedValue({
        _id: '123',
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department'
      });
  
      await departmentController.createDepartment(req, res, next);
  
      expect(findDepartment).toHaveBeenCalledWith('corporateUserID', 'HR', 12345);
      expect(createDepartment).toHaveBeenCalledWith({
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department',
        corporateUser: 'corporateUserID',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        responseCode: '000',
        message: 'Department data created successfully',
        data: {
          _id: '123',
          departmentName: 'HR',
          departmentCode: 12345,
          description: 'HR Department'
        },
      });
    });
  
    it('should return error if department exists', async () => {
      const req = {
        user: { _id: 'corporateUserID' },
        body: {
          departmentName: 'HR',
          departmentCode: 12345,
          description: 'HR Department'
        },
      };
      const res = {};
      const next = jest.fn();
  
      findDepartment.mockResolvedValue({ departmentName: 'HR' });
  
      await departmentController.createDepartment(req, res, next);
  
      expect(findDepartment).toHaveBeenCalledWith('corporateUserID', 'HR', 12345);
      expect(next).toHaveBeenCalledWith(new ErrorResponse('Department is already existing with this name or code', 400));
    });
  });
  