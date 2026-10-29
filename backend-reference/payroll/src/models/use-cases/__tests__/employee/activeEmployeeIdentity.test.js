const { activeEmployeeFilter, getOffBoardingStage, findActiveIdentityConflict } = require('../../../use-cases/employee');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');

const TODAY = new Date(2026, 9, 5, 15, 30); // 5 Oct 2026, 3:30 pm local
const day = (d) => new Date(2026, 9, d);

const offboarded = (status, lastWorkingDay) => ({
    employeeInformation: { employeeStatus: status },
    offBoardingInformation: { offBoardingType: 'RESIGNATION', lastWorkingDay },
});

describe('active employee identity rules', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: TODAY });
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('activeEmployeeFilter', () => {
        it('excludes deleted employees and offboarded employees whose last working day is before today', () => {
            expect(activeEmployeeFilter('762')).toEqual({
                corporateUser: '762',
                isEmployeeDeleted: false,
                $nor: [{
                    'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] },
                    'offBoardingInformation.lastWorkingDay': { $lt: day(5) },
                }],
            });
        });
    });

    describe('getOffBoardingStage', () => {
        it('is NOTICE_PERIOD through the last working day', () => {
            expect(getOffBoardingStage(offboarded('RESIGNED', day(20)))).toBe('NOTICE_PERIOD');
            expect(getOffBoardingStage(offboarded('SUSPENDED', day(5)))).toBe('NOTICE_PERIOD');
        });

        it('is PAST from the day after the last working day', () => {
            expect(getOffBoardingStage(offboarded('RESIGNED', day(4)))).toBe('PAST');
        });

        it('is null for an employee who was never offboarded or was set back to active', () => {
            expect(getOffBoardingStage({ employeeInformation: { employeeStatus: 'ACTIVE' } })).toBeNull();
            expect(getOffBoardingStage(offboarded('ACTIVE', day(4)))).toBeNull();
        });
    });

    describe('findActiveIdentityConflict', () => {
        const mockFound = (docs) => Employee.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(docs) });

        it('queries only active employees of the company, excluding the employee being edited', async () => {
            mockFound([]);

            await findActiveIdentityConflict('762', { 'personalInformation.email': 'a@b.com', panNumber: 'ABCDE1234F' }, 'emp1');

            expect(Employee.find).toHaveBeenCalledWith(
                {
                    ...activeEmployeeFilter('762'),
                    _id: { $ne: 'emp1' },
                    $or: [{ 'personalInformation.email': 'a@b.com' }, { panNumber: 'ABCDE1234F' }],
                },
                { 'personalInformation.email': 1, panNumber: 1 }
            );
        });

        it('returns the first conflicting field in the order given', async () => {
            mockFound([{ panNumber: 'ABCDE1234F', personalInformation: { email: 'a@b.com' } }]);

            const conflict = await findActiveIdentityConflict('762', {
                'personalInformation.mobileNo': '9895270766',
                'personalInformation.email': 'a@b.com',
                panNumber: 'ABCDE1234F',
            });

            expect(conflict).toBe('personalInformation.email');
        });

        it('returns null when no active employee holds the values', async () => {
            mockFound([]);

            expect(await findActiveIdentityConflict('762', { panNumber: 'ABCDE1234F' })).toBeNull();
        });

        it('skips empty values and does not query when nothing is left to check', async () => {
            const conflict = await findActiveIdentityConflict('762', { panNumber: '', 'otherConfigurations.epfUAN': null });

            expect(conflict).toBeNull();
            expect(Employee.find).not.toHaveBeenCalled();
        });
    });
});
