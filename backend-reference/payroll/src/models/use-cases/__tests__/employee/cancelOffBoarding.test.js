const { cancelOffBoarding, getCancelOffBoardingPreview } = require('../../../use-cases/employee');
const Employee = require('../../../entities/employee');
const Salary = require('../../../entities/salary');

jest.mock('../../../entities/employee');
jest.mock('../../../entities/salary');

const TODAY = new Date(2026, 9, 6, 11, 0); // 6 Oct 2026
const day = (m, d) => new Date(2026, m, d);

const offboardedEmployee = (overrides = {}) => ({
    _id: 'emp1',
    corporateUser: '1045',
    personalInformation: { fullName: 'Lakshmi Devi' },
    employeeInformation: { employeeStatus: 'RESIGNED', dateOfJoin: day(6, 6), probationPeriod: 0 },
    offBoardingInformation: {
        offBoardingDate: day(9, 5),
        lastWorkingDay: day(10, 4),
        noticePeriod: 30,
        offBoardingType: 'RESIGNATION',
        reasonForOffBoarding: 'Better offer',
        previousEmployeeStatus: 'CONFIRMED',
    },
    ...overrides,
});

const mockFound = (employee) => Employee.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(employee) });
const mockSettledSalary = (salary) => Salary.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(salary) });

describe('cancel offboarding', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: TODAY });
        jest.clearAllMocks();
        Employee.findOneAndUpdate.mockImplementation(async (filter, update) => update);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('only finds employees still serving notice (last working day today or later)', async () => {
        mockFound(null);

        await cancelOffBoarding({ employeeId: 'emp1', corporateUser: '1045' });

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: 'emp1',
            corporateUser: '1045',
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] },
            'offBoardingInformation.lastWorkingDay': { $gte: day(9, 6) },
        });
        expect(Employee.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('restores the saved status, removes the offboarding and keeps it in history as CANCELLED', async () => {
        const employee = offboardedEmployee();
        mockFound(employee);

        const update = await cancelOffBoarding({ employeeId: 'emp1', corporateUser: '1045', cancelledBy: 'hr@vanta', reason: 'Counter-offer accepted' });

        expect(Employee.findOneAndUpdate.mock.calls[0][0]).toEqual({
            _id: 'emp1',
            corporateUser: '1045',
            'employeeInformation.employeeStatus': 'RESIGNED',
            'offBoardingInformation.lastWorkingDay': day(10, 4),
        });
        expect(update.$set).toEqual({ 'employeeInformation.employeeStatus': 'CONFIRMED' });
        expect(update.$unset).toEqual({ offBoardingInformation: 1 });
        expect(update.$push.offBoardingHistory).toEqual({
            ...employee.offBoardingInformation,
            status: 'CANCELLED',
            cancelledAt: TODAY,
            cancelledBy: 'hr@vanta',
            cancellationReason: 'Counter-offer accepted',
        });
    });

    it('puts an older offboarding (no saved status) back on probation while the probation period runs', async () => {
        const employee = offboardedEmployee({
            employeeInformation: { employeeStatus: 'RESIGNED', dateOfJoin: day(7, 3), probationPeriod: 3 },
        });
        delete employee.offBoardingInformation.previousEmployeeStatus;
        mockFound(employee);

        const update = await cancelOffBoarding({ employeeId: 'emp1', corporateUser: '1045' });

        expect(update.$set).toEqual({ 'employeeInformation.employeeStatus': 'INPROBATION' });
    });

    it('puts an older offboarding past its probation period back to the default ACTIVE', async () => {
        const employee = offboardedEmployee({
            employeeInformation: { employeeStatus: 'SUSPENDED', dateOfJoin: day(0, 10), probationPeriod: 3 },
        });
        delete employee.offBoardingInformation.previousEmployeeStatus;
        mockFound(employee);

        const update = await cancelOffBoarding({ employeeId: 'emp1', corporateUser: '1045' });

        expect(update.$set).toEqual({ 'employeeInformation.employeeStatus': 'ACTIVE' });
    });

    describe('getCancelOffBoardingPreview', () => {
        it('warns when the final-month salary covering the last working day was approved or paid', async () => {
            mockFound(offboardedEmployee());
            mockSettledSalary({ month: 11, year: 2026, paymentStatus: 'APPROVED' });

            const preview = await getCancelOffBoardingPreview('emp1', '1045');

            expect(Salary.findOne).toHaveBeenCalledWith(
                {
                    corporateUser: '1045',
                    employee: 'emp1',
                    salaryCycleStart: { $lte: day(10, 4) },
                    salaryCycleEnd: { $gte: day(10, 4) },
                    paymentStatus: { $in: ['APPROVED', 'INITIATED', 'PAID', 'COMPLETED'] },
                },
                { month: 1, year: 1, paymentStatus: 1 }
            );
            expect(preview).toEqual({
                fullName: 'Lakshmi Devi',
                offBoardingDate: day(9, 5),
                lastWorkingDay: day(10, 4),
                offBoardingType: 'RESIGNATION',
                restoredStatus: 'CONFIRMED',
                settlementProcessed: true,
                settledSalary: { month: 11, year: 2026, paymentStatus: 'APPROVED' },
            });
        });

        it('has no warning when the final salary is still pending', async () => {
            mockFound(offboardedEmployee());
            mockSettledSalary(null);

            const preview = await getCancelOffBoardingPreview('emp1', '1045');

            expect(preview.settlementProcessed).toBe(false);
            expect(preview.settledSalary).toBeNull();
        });

        it('is null when the offboarding cannot be cancelled', async () => {
            mockFound(null);

            expect(await getCancelOffBoardingPreview('emp1', '1045')).toBeNull();
            expect(Salary.findOne).not.toHaveBeenCalled();
        });
    });
});
