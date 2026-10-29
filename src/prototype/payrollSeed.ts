// PROTOTYPE-SETUP: seeded Payroll setup/subscription state so /payroll lands on the dashboard with no backend,
// and the "not set up / not purchased" variant used by the /onboarding/payroll/* flow.
import type { SubscriptionDetailsResponse } from '@domains/dashboard/IndividualPlan/types';

// payrollAuth slice values (normally from GET payroll/dashBoard/progress).
export const PAYROLL_SEEDED_PROGRESS = {
    departmentAndEmployees: true,
    progress: '100%',
    leaveandAttendance: true,
    payrollSettings: true,
    complianceSettings: true,
    showDashboard: true,
    isPurchased: true,
    hasBasicSalaryComponent: true,
    basicSalaryAmount: 50,
    onBoardStatus: 3,
    isSkippedDasboard: false,
    numberOfDaysWorking: 26,
    hasSalaryRolloutSetup: true as boolean | null,
};

// First-run state for the onboarding flow: nothing purchased or configured yet.
export const PAYROLL_ONBOARDING_PROGRESS: typeof PAYROLL_SEEDED_PROGRESS = {
    departmentAndEmployees: false,
    progress: '0%',
    leaveandAttendance: false,
    payrollSettings: false,
    complianceSettings: false,
    showDashboard: false,
    isPurchased: false,
    hasBasicSalaryComponent: false,
    basicSalaryAmount: 0,
    onBoardStatus: 0,
    isSkippedDasboard: false,
    numberOfDaysWorking: 0,
    hasSalaryRolloutSetup: false,
};

// Illustrative Payroll package (no package seed exists in backend-reference).
const DEMO_PAYROLL_PACKAGE = {
    id: 1,
    packageName: 'Payroll',
    packagePrices: { monthly: '1999', annually: '19990' },
    description: 'Payroll, attendance, leave and employee self-service',
    discount: { monthly: 0, annually: 17 },
};

// getPurchaseDetailsApi() response: purchased for /payroll, pre-purchase for onboarding.
export const buildDemoSubscription = (purchased: boolean): SubscriptionDetailsResponse => ({
    packageDetails: [DEMO_PAYROLL_PACKAGE],
    isPurchased: purchased,
    isPaidGroupUser: false,
    ownsIndividualPackage: purchased,
    previousSubscription: null as unknown as SubscriptionDetailsResponse['previousSubscription'],
    paidPlanExpiredRecently: null,
    lifecycle: purchased
        ? { state: 'ACTIVE', gracePeriodDays: 0, frozenPeriodDays: 0, payrollDataClearDays: 0 }
        : { state: 'NONE', gracePeriodDays: 0, frozenPeriodDays: 0, payrollDataClearDays: 0 },
    showSubscriptionLanding: false,
    subscriptionLandingKey: null,
});
