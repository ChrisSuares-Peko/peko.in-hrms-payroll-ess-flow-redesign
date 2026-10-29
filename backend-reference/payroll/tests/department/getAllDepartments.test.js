const {
    getAllDepartmentData,
  } = require('../../src/models/use-cases/department');
  const departmentController = require('../../src/controller/department');
  
  
  jest.mock('../../src/models/use-cases/department');
  
  describe('Department Controller - Get All Departments', () => {
    it('should get all departments', async () => {
      const req = {
        user: { _id: 'corporateUserID' },
        query: { page: '1', limit: '10', searchText: '' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
  
      getAllDepartmentData.mockResolvedValue([{
        departmentName: 'HR',
        departmentCode: 12345,
        description: 'HR Department'
      }]);
  
      await departmentController.getAllDepartment(req, res, next);
  
      expect(getAllDepartmentData).toHaveBeenCalledWith({
        corporateUserID: 'corporateUserID',
        page: 1,
        limit: 10,
        searchText: '',
        skip: 0,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        responseCode: '000',
        message: 'Department data fetched successfully',
        data: [{
          departmentName: 'HR',
          departmentCode: 12345,
          description: 'HR Department'
        }],
      });
    });
  });
  