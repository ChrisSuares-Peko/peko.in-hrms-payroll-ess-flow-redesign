const {
    getEmploymentStage,
    statusForProbation,
    withManagedEmploymentFields,
    confirmProbation,
    extendProbation,
    probationReviewActivity,
} = require('../../../use-cases/employee');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');

const TODAY = new Date(2026, 9, 7, 11, 0); // 7 Oct 2026, as in the prototype's worked sample
const day = (m, d) => new Date(2026, m, d);

const employee = (employeeInformation, extra = {}) => ({
    _id: 'emp1',
    corporateUser: '1045',
    personalInformation: { fullName: 'Kavya Nair' },
    employeeInformation,
    ...extra,
});

describe('probation stage', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: TODAY });
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('getEmploymentStage (prototype worked sample)', () => {
        it('is ON_PROBATION with the days left until the probation ends', () => {
            // Ganesh Pawar — joined 2026-07-13, 3 months → ends 2026-10-13 (6 days)
            expect(getEmploymentStage(employee({ employeeStatus: 'INPROBATION', dateOfJoin: day(6, 13), probationPeriod: 3 })))
                .toEqual({ stage: 'ON_PROBATION', probationEndDate: day(9, 13), daysLeft: 6 });
        });

        it('is PROBATION_REVIEW_DUE once the end date has passed and HR has not acted', () => {
            // Kavya Nair — joined 2026-06-15, 3 months → ended 2026-09-15
            expect(getEmploymentStage(employee({ employeeStatus: 'INPROBATION', dateOfJoin: day(5, 15), probationPeriod: 3 })))
                .toEqual({ stage: 'PROBATION_REVIEW_DUE', probationEndDate: day(8, 15) });
        });

        it('is CONFIRMED with the confirmation date once HR confirms', () => {
            expect(getEmploymentStage(employee({
                employeeStatus: 'CONFIRMED', dateOfJoin: day(5, 15), probationPeriod: 3, confirmationDate: day(8, 15),
            }))).toEqual({ stage: 'CONFIRMED', confirmationDate: day(8, 15) });
        });

        it('is CONFIRMED from joining for an employee with no probation', () => {
            expect(getEmploymentStage(employee({ employeeStatus: 'ACTIVE', dateOfJoin: day(0, 10), probationPeriod: 0 })))
                .toEqual({ stage: 'CONFIRMED', confirmationDate: null });
        });

        it('treats an older ACTIVE employee as confirmed once their probation ended, without a review', () => {
            expect(getEmploymentStage(employee({ employeeStatus: 'ACTIVE', dateOfJoin: new Date(2021, 3, 5), probationPeriod: 3 })))
                .toEqual({ stage: 'CONFIRMED', confirmationDate: new Date(2021, 6, 5) });
        });

        it('shows NOTICE_PERIOD and EXITED for leavers', () => {
            const resigned = (lastWorkingDay) => employee(
                { employeeStatus: 'RESIGNED', dateOfJoin: day(0, 10), probationPeriod: 3 },
                { offBoardingInformation: { offBoardingType: 'RESIGNATION', lastWorkingDay } }
            );
            expect(getEmploymentStage(resigned(day(10, 6)))).toEqual({ stage: 'NOTICE_PERIOD', lastWorkingDay: day(10, 6) });
            expect(getEmploymentStage(resigned(day(8, 30)))).toEqual({ stage: 'EXITED', lastWorkingDay: day(8, 30) });
        });
    });

    describe('stored status', () => {
        it('is INPROBATION with a probation period and ACTIVE without one', () => {
            expect(statusForProbation(3)).toBe('INPROBATION');
            expect(statusForProbation('6')).toBe('INPROBATION');
            expect(statusForProbation(0)).toBe('ACTIVE');
            expect(statusForProbation(null)).toBe('ACTIVE');
        });

        it('keeps the status and confirmation an edit form must not change', () => {
            const existing = { employeeStatus: 'CONFIRMED', probationPeriod: 3, confirmationDate: day(8, 15), confirmedBy: 'hr' };
            expect(withManagedEmploymentFields({ designation: 'Lead', employeeStatus: 'ACTIVE', probationPeriod: 3 }, existing))
                .toEqual({ designation: 'Lead', probationPeriod: 3, employeeStatus: 'CONFIRMED', confirmationDate: day(8, 15), confirmedBy: 'hr' });
        });

        it('restarts the review when the probation months of an unconfirmed employee change', () => {
            expect(withManagedEmploymentFields({ probationPeriod: 6 }, { employeeStatus: 'ACTIVE', probationPeriod: 0 }).employeeStatus)
                .toBe('INPROBATION');
            expect(withManagedEmploymentFields({ probationPeriod: 0 }, { employeeStatus: 'INPROBATION', probationPeriod: 3 }).employeeStatus)
                .toBe('ACTIVE');
            expect(withManagedEmploymentFields({ probationPeriod: 6 }, { employeeStatus: 'RESIGNED', probationPeriod: 3 }).employeeStatus)
                .toBe('RESIGNED');
        });
    });

    describe('confirm and extend', () => {
        const onReview = () => employee({ employeeStatus: 'INPROBATION', dateOfJoin: day(5, 15), probationPeriod: 3 });
        const mockFound = (doc) => Employee.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(doc) });

        beforeEach(() => {
            Employee.findOneAndUpdate.mockImplementation(async (filter, update) => ({ filter, update }));
        });

        it('confirms a review-due employee on the day probation ended', async () => {
            mockFound(onReview());

            const { employee: { filter, update } } = await confirmProbation('emp1', '1045', 'hr');

            expect(filter).toEqual({
                _id: 'emp1', corporateUser: '1045',
                'employeeInformation.employeeStatus': 'INPROBATION', 'employeeInformation.probationPeriod': 3,
            });
            expect(update.$set).toEqual({
                'employeeInformation.employeeStatus': 'CONFIRMED',
                'employeeInformation.confirmationDate': day(8, 15),
                'employeeInformation.confirmedBy': 'hr',
            });
        });

        it('extends probation, records the reason and the new end date', async () => {
            mockFound(onReview());

            const { employee: { update } } = await extendProbation('emp1', '1045', { months: 2, reason: 'Needs more time', extendedBy: 'hr' });

            expect(update.$set).toEqual({ 'employeeInformation.probationPeriod': 5, 'employeeInformation.employeeStatus': 'INPROBATION' });
            expect(update.$push.probationExtensions).toEqual({
                months: 2, reason: 'Needs more time', previousEndDate: day(8, 15), newEndDate: day(10, 15), extendedAt: TODAY, extendedBy: 'hr',
            });
        });

        it('refuses to confirm or extend an employee who is not on probation', async () => {
            mockFound(employee({ employeeStatus: 'CONFIRMED', dateOfJoin: day(0, 10), probationPeriod: 3 }));

            expect(await confirmProbation('emp1', '1045', 'hr')).toEqual({ error: 'This employee is not on probation.', status: 400 });
            expect(Employee.findOneAndUpdate).not.toHaveBeenCalled();
        });
    });

    describe('probationReviewActivity', () => {
        it('words an overdue review as the prototype dashboard does, dated today', () => {
            expect(probationReviewActivity({ fullName: 'Kavya Nair', probationEndDate: day(8, 15), overdue: true })).toEqual({
                title: 'Probation review overdue — Kavya Nair',
                body: 'Probation ended on 2026-09-15. Confirm or extend from the employee profile.',
                start: day(9, 7),
            });
        });

        it('dates an upcoming review on the probation end date', () => {
            expect(probationReviewActivity({ fullName: 'Ganesh Pawar', probationEndDate: day(9, 13), overdue: false })).toEqual({
                title: 'Probation review — Ganesh Pawar',
                body: 'Probation ends on 2026-10-13. Confirm or extend from the employee profile.',
                start: day(9, 13),
            });
        });
    });
});
