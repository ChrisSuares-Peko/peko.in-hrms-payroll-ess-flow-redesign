const { findOnePlan } = require('../../../use-cases/software_plans'); 
const software_plans = require('../../../entities/software_plans'); 
const softwares = require('../../../entities/softwares'); 

jest.mock('../../../entities/software_plans', () => ({
    findOne: jest.fn(),
}));

describe('findOnePlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the plan with included models when found', async () => {
        const mockParams = { id: 1 };
        const mockPlanAttributes = ['name', 'price'];
        const mockProductAttributes = ['productName', 'description'];
        const mockPlan = {
            id: 1,
            name: 'Test Plan',
            price: 10,
            softwares: {
                productName: 'Test Software',
                description: 'Software Description',
                vendor: {
                    vendorEmail: 'test@example.com',
                    vendorName: 'Test Vendor',
                    optional1: 'optional1',
                    apiUrl: 'http://example.com/api',
                    optional2: 'optional2',
                },
            },
        };

        software_plans.findOne.mockResolvedValue(mockPlan);

        const result = await findOnePlan(mockParams, mockPlanAttributes, mockProductAttributes);

        expect(software_plans.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            attributes: mockPlanAttributes,
            include: [
                {
                    model: softwares,
                    attributes: mockProductAttributes,
                },
            ],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockPlan);
    });

    it('should return null when plan is not found', async () => {
        const mockParams = { id: 1 };
        const mockPlanAttributes = ['name', 'price'];
        const mockProductAttributes = ['productName', 'description'];

        software_plans.findOne.mockResolvedValue(null);

        const result = await findOnePlan(mockParams, mockPlanAttributes, mockProductAttributes);

        expect(software_plans.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            attributes: mockPlanAttributes,
            include: [
                {
                    model: softwares,
                    attributes: mockProductAttributes,
                  
                },
            ],
            raw: true,
            nest: true,
        });
        expect(result).toBeNull();
    });

      it('should return plan with default attributes when not provided', async () => {
        const mockParams = { id: 1 };
        const mockPlan = {
            id: 1,
            name: 'Test Plan',
            price: 10,
            softwares: {
                productName: 'Test Software',
                description: 'Software Description',
                vendor: {
                    vendorEmail: 'test@example.com',
                    vendorName: 'Test Vendor',
                    optional1: 'optional1',
                    apiUrl: 'http://example.com/api',
                    optional2: 'optional2',
                },
            },
        };

        software_plans.findOne.mockResolvedValue(mockPlan);

        const result = await findOnePlan(mockParams); // No attributes provided

        expect(software_plans.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            attributes: undefined, // Default attributes
            include: [
                {
                    model: softwares,
                    attributes: undefined, // Default attributes
                 
                },
            ],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockPlan);
    });


    it('should handle errors during database operations', async () => {
        const mockParams = { id: 1 };
        const mockPlanAttributes = ['name', 'price'];
        const mockProductAttributes = ['productName', 'description'];
        const mockError = new Error('Database error');

        software_plans.findOne.mockRejectedValue(mockError);

        await expect(findOnePlan(mockParams, mockPlanAttributes, mockProductAttributes)).rejects.toThrow(mockError); // Or handle as you prefer

        expect(software_plans.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            attributes: mockPlanAttributes,
            include: [
                {
                    model: softwares,
                    attributes: mockProductAttributes,
                   
                },
            ],
            raw: true,
            nest: true,
        });
    });

    it('should handle missing id parameter', async () => {
        const mockParams = {}; // Missing id
        const mockPlanAttributes = ['name', 'price'];
        const mockProductAttributes = ['productName', 'description'];

        await expect(findOnePlan(mockParams, mockPlanAttributes, mockProductAttributes)).rejects.toThrow(); // Or handle as you prefer

        // If you *don't* throw an error but handle it gracefully (e.g., return null),
        // then you would change the test to:
        // const result = await findOnePlan(mockParams, mockPlanAttributes, mockProductAttributes);
        // expect(result).toBeNull();
    });
});