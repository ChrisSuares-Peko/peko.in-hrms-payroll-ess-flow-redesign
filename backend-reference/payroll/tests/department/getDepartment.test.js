const {
    getDepartmentUsingCorporateId,
  } = require('../../src/models/use-cases/department');
  const departmentController = require('../../src/controller/department');
  
  // Mock the required functions
  jest.mock('../../src/models/use-cases/department');
  
  describe('Department Controller - Get Department', () => {
    it('should get department data', async () => {
      const req = {
        user: { _id: 'corporateUserID' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
  
      getDepartmentUsingCorporateId.mockResolvedValue([
        { _id: 'deptId1', departmentName: 'HR' },
        { _id: 'deptId2', departmentName: 'IT' }
      ]);
  
      await departmentController.getDepartment(req, res, next);
  
      expect(getDepartmentUsingCorporateId).toHaveBeenCalledWith('corporateUserID');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        responseCode: '000',
        message: 'Department data fetched successfully',
        data: [
          { _id: 'deptId1', departmentName: 'HR' },
          { _id: 'deptId2', departmentName: 'IT' }
        ]
      });
    });
  });
  