// PROTOTYPE-SETUP: the one and only demo employee identity shown in ESS and ESS onboarding.
// It is demo data, not an auth mock: the logged-in user stays MOCK_AUTHENTICATED_USER (corporate).
// Hook-in point for the Phase 7 dataset task. Salary figures follow docs/backend-calculations.md
// (default split: Basic = 50% of gross, HRA = 50% of Basic, Other Allowance = remainder; PF on the
// Oct 2026 ₹25,000 ceiling; PT configured at ₹200; new regime, fully rebated under 87A).
import type {
    EmployeeProfile,
    RequiredOnboardingDocument,
} from '@src/domains/employee/api/onboarding';

export const DEMO_EMPLOYEE = {
    id: 1042,
    employeeCode: 'ACME-0042',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@acmecorp.example',
    mobileNo: '9812345670',
    designation: 'Senior Product Designer',
    department: { id: 'dept-design', departmentName: 'Design', departmentCode: 'DSN' },
    reportingManager: { id: 'emp-0007', name: 'Priya Sharma', designation: 'Head of Product' },
    dateOfJoining: '2024-04-15',
    workState: 'Karnataka',
    timeSchedule: '09:30 AM - 06:30 PM',
    companyName: 'Acme Corp Pvt Ltd',
    address: {
        addressLine1: '42, 3rd Cross, Indiranagar',
        addressLine2: 'HAL 2nd Stage',
        state: 'Karnataka',
        country: 'India',
        pinCode: '560038',
    },
    bank: {
        accountName: 'Arjun Mehta',
        bankName: 'HDFC Bank',
        accountNumber: 'XXXXXXXX4821',
        ifscCode: 'HDFC0000123',
        upiId: 'arjun.mehta@okhdfc',
    },
    emergencyContact: { name: 'Neha Mehta', mobileNo: '9812345671', relation: 'Spouse' },
    // Monthly salary structure (₹), regular month: no LOP / overtime / reimbursement.
    salaryStructure: {
        annualCtc: 960000,
        monthlyCtc: 80000,
        taxRegime: 'new',
        earnings: { basic: 38375, hra: 19187.5, otherAllowance: 19187.5 },
        grossMonthly: 76750,
        employerContributions: { eps: 2083, epf: 917, edli: 125, pfAdmin: 125, total: 3250 },
        deductions: { employeePf: 3000, esi: 0, professionalTax: 200, tds: 0, total: 3200 },
        netMonthly: 73550,
    },
} as const;

// Documents HR requires in ESS onboarding (EssSettings). Includes bank details so every
// onboarding step (Documents, Bank, Emergency) renders.
export const DEMO_REQUIRED_ONBOARDING_DOCUMENTS: RequiredOnboardingDocument[] = [
    { key: 'panCard', label: 'PAN Card' },
    { key: 'aadhaarCard', label: 'Aadhaar Card' },
    { key: 'bankAccountDetails', label: 'Bank Account Details' },
];

// The getEmployeeProfile() response shape, built from DEMO_EMPLOYEE.
export const buildDemoEmployeeProfile = (isCompleted: boolean): EmployeeProfile => ({
    id: String(DEMO_EMPLOYEE.id),
    isCompleted,
    personalInformation: {
        fullName: DEMO_EMPLOYEE.name,
        mobileNo: DEMO_EMPLOYEE.mobileNo,
        email: DEMO_EMPLOYEE.email,
        ...DEMO_EMPLOYEE.address,
        ...(isCompleted
            ? {
                  emergencyContactName: DEMO_EMPLOYEE.emergencyContact.name,
                  emergencyContactNo: DEMO_EMPLOYEE.emergencyContact.mobileNo,
                  emergencyContactRelation: DEMO_EMPLOYEE.emergencyContact.relation,
              }
            : {}),
    },
    employeeInformation: {
        employeeId: DEMO_EMPLOYEE.employeeCode,
        designation: DEMO_EMPLOYEE.designation,
        department: { ...DEMO_EMPLOYEE.department },
        reportingStaff: DEMO_EMPLOYEE.reportingManager.id,
        reportingStaffName: DEMO_EMPLOYEE.reportingManager.name,
        dateOfJoin: DEMO_EMPLOYEE.dateOfJoining,
        employeeStatus: 'active',
        workEmailId: DEMO_EMPLOYEE.email,
        timeSchedule: DEMO_EMPLOYEE.timeSchedule,
    },
    corporateUser: { companyName: DEMO_EMPLOYEE.companyName },
    bankDetails: isCompleted
        ? {
              bankName: DEMO_EMPLOYEE.bank.bankName,
              accountNumber: DEMO_EMPLOYEE.bank.accountNumber,
              ifscCode: DEMO_EMPLOYEE.bank.ifscCode,
              upiId: DEMO_EMPLOYEE.bank.upiId,
          }
        : null,
    profileUpdateRequestPending: false,
    bankUpdateRequestPending: false,
    employeeDocuments: [],
});
