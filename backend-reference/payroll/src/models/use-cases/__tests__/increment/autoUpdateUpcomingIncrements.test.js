const { autoUpdateUpcomingIncrements } = require('../../../use-cases/increment');
const Increment = require('../../../entities/increment');
const mongoose = require('mongoose');


jest.mock('../../../entities/increment');

describe('autoUpdateUpcomingIncrements', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update upcoming increments correctly for a valid incrementId', async () => {
        const incrementId = '60c72b2f5f1b2c001c8e4cfb'; 
        const mockIncrement = {
            _id: incrementId,
            effectiveDate: new Date('2023-01-01'),
            basicSalary: 50000,
            newBasicSalary: 55000,
            employee: '60c72b2f5f1b2c001c8e4cf1', 
            corporateUser: 'validCorporateUserId',
            save: jest.fn().mockResolvedValue(true)
        };

        const mockUpcomingIncrements = [
            {
                _id: '60c72b2f5f1b2c001c8e4cf2', 
                effectiveDate: new Date('2023-06-01'),
                basicSalary: 55000,
                newBasicSalary: 60000,
                employee: '60c72b2f5f1b2c001c8e4cf1', 
                corporateUser: 'validCorporateUserId',
                incrementType: 'percentage',
                incrementPercentage: 10,
                incrementAmount: 5000,
                save: jest.fn().mockResolvedValue(true)
            },
            {
                _id: '60c72b2f5f1b2c001c8e4cf3', 
                effectiveDate: new Date('2023-12-01'),
                basicSalary: 60000,
                newBasicSalary: 65000,
                employee: '60c72b2f5f1b2c001c8e4cf1', 
                corporateUser: 'validCorporateUserId',
                incrementType: 'flat',
                incrementAmount: 5000,
                incrementPercentage: 8.33,
                save: jest.fn().mockResolvedValue(true)
            }
        ];

        Increment.findOne.mockResolvedValue(mockIncrement);
        Increment.find.mockReturnValue({
            sort: jest.fn().mockReturnValue(mockUpcomingIncrements)
        });

        const result = await autoUpdateUpcomingIncrements({ incrementId });

        expect(Increment.findOne).toHaveBeenCalledWith({ _id: incrementId });
        expect(Increment.find).toHaveBeenCalledWith({
            employee: new mongoose.Types.ObjectId(mockIncrement.employee),
            corporateUser: mockIncrement.corporateUser,
            effectiveDate: {
                $gte: mockIncrement.effectiveDate
            },
            _id: { $ne: new mongoose.Types.ObjectId(incrementId) }
        });

        const updatedIncrementAmount = (55000 * 10) / 100;
        expect(mockUpcomingIncrements[0].basicSalary).toBe(55000);
        expect(mockUpcomingIncrements[0].incrementAmount).toBe(updatedIncrementAmount); 
        expect(mockUpcomingIncrements[0].newBasicSalary).toBe(55000 + updatedIncrementAmount); 
        expect(mockUpcomingIncrements[0].save).toHaveBeenCalled();

        const updatedBasicSalary = 60500;
        const updatedIncrementPercentage = (5000 / updatedBasicSalary) * 100;
        expect(mockUpcomingIncrements[1].basicSalary).toBe(updatedBasicSalary);
        expect(mockUpcomingIncrements[1].incrementPercentage).toBeCloseTo(updatedIncrementPercentage, 2); 
        expect(mockUpcomingIncrements[1].newBasicSalary).toBe(updatedBasicSalary + 5000); 
        expect(mockUpcomingIncrements[1].save).toHaveBeenCalled();

        expect(result).toBe(true);
    });

    it('should update upcoming increments correctly when isDelete is true', async () => {
        const incrementId = '60c72b2f5f1b2c001c8e4cfb'; 
        const mockIncrement = {
            _id: incrementId,
            effectiveDate: new Date('2023-01-01'),
            basicSalary: 50000,
            newBasicSalary: 55000,
            employee: '60c72b2f5f1b2c001c8e4cf1', 
            corporateUser: 'validCorporateUserId',
            save: jest.fn().mockResolvedValue(true)
        };

        const mockUpcomingIncrements = [
            {
                _id: '60c72b2f5f1b2c001c8e4cf2', 
                effectiveDate: new Date('2023-06-01'),
                basicSalary: 50000,
                newBasicSalary: 55000,
                employee: '60c72b2f5f1b2c001c8e4cf1', 
                corporateUser: 'validCorporateUserId',
                incrementType: 'percentage',
                incrementPercentage: 10,
                incrementAmount: 5000,
                save: jest.fn().mockResolvedValue(true)
            }
        ];

        Increment.findOne.mockResolvedValue(mockIncrement);
        Increment.find.mockReturnValue({
            sort: jest.fn().mockReturnValue(mockUpcomingIncrements)
        });

        const result = await autoUpdateUpcomingIncrements({ incrementId, isDelete: true });

        expect(Increment.findOne).toHaveBeenCalledWith({ _id: incrementId });
        expect(Increment.find).toHaveBeenCalledWith({
            employee: new mongoose.Types.ObjectId(mockIncrement.employee),
            corporateUser: mockIncrement.corporateUser,
            effectiveDate: {
                $gte: mockIncrement.effectiveDate
            },
            _id: { $ne: new mongoose.Types.ObjectId(incrementId) }
        });
        
        expect(mockUpcomingIncrements[0].basicSalary).toBe(50000);
        expect(mockUpcomingIncrements[0].incrementAmount).toBe((50000 * 10) / 100); 
        expect(mockUpcomingIncrements[0].newBasicSalary).toBe(50000 + ((50000 * 10) / 100));
        expect(mockUpcomingIncrements[0].save).toHaveBeenCalled();

        expect(result).toBe(true);
    });

    it('should return false if an error occurs', async () => {
        const incrementId = '60c72b2f5f1b2c001c8e4cfb'; 
        const mockError = new Error('Database error');

        console.log = jest.fn();
        Increment.findOne.mockRejectedValue(mockError);

        const result = await autoUpdateUpcomingIncrements({ incrementId });

        expect(Increment.findOne).toHaveBeenCalledWith({ _id: incrementId });
        expect(result).toBe(false);
    });
});
