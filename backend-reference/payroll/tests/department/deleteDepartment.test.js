const {
    findDepartmentByIdAndCorporateUser,
    deleteDepartment,
  } = require('../../src/models/use-cases/department');
  const { fetchEmployeeWithDepartment } = require('../../src/models/use-cases/employee');
  const departmentController = require('../../src/controller/department');
  const ErrorResponse = require('../../src/utils/error-response');
  
  // Mock the required functions
  jest.mock('../../src/models/use-cases/department');
  jest.mock('../../src/models/use-cases/employee');
  
  describe('Department Controller - Delete Department', () => {
    it('should delete a department', async () => {
      const req = {
        user: { _id: 'corporateUserID' },
        params: { id: 'departmentId' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
  
      findDepartmentByIdAndCorporateUser.mockResolvedValue(true);
      fetchEmployeeWithDepartment.mockResolvedValue(null);
      deleteDepartment.mockResolvedValue({});
  
      await departmentController.deleteDepartment(req, res, next);
  
      expect(findDepartmentByIdAndCorporateUser).toHaveBeenCalledWith('departmentId', 'corporateUserID');
      expect(fetchEmployeeWithDepartment).toHaveBeenCalledWith('corporateUserID', 'departmentId');
      expect(deleteDepartment).toHaveBeenCalledWith({
        corporateUserID: 'corporateUserID',
        departmentId: 'departmentId',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        responseCode: '000',
        message: 'Department data deleted successfully',
        data: {},
      });
    });
  
    it('should return error if department not found', async () => {
      const req = {
        user: { _id: 'corporateUserID' },
        params: { id: 'departmentId' },
      };
      const res = {};
      const next = jest.fn();
  
      findDepartmentByIdAndCorporateUser.mockResolvedValue(null);
  
      await departmentController.deleteDepartment(req, res, next);
  
      expect(findDepartmentByIdAndCorporateUser).toHaveBeenCalledWith('departmentId', 'corporateUserID');
      expect(next).toHaveBeenCalledWith(new ErrorResponse('Department data not found or unauthorized to delete', 400));
    });
  });
  