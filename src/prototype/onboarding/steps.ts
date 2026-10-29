// PROTOTYPE-SETUP: the onboarding screens found in Phase 0, in the order a new customer / employee meets them.
// Every step is reachable directly, regardless of setup status or first-run flags.
export type OnboardingFlow = 'payroll' | 'ess';

export type OnboardingStep = {
    slug: string;
    title: string;
    description: string;
};

export const PAYROLL_ONBOARDING_STEPS: OnboardingStep[] = [
    {
        slug: 'purchase',
        title: 'Purchase Payroll',
        description: 'Subscription landing shown before Payroll is purchased (SubscriptionPage).',
    },
    {
        slug: 'setup-wizard',
        title: 'Setup wizard',
        description:
            'First-run wizard: company details, payroll cycle, salary components, add employees (WelcomePage).',
    },
    {
        slug: 'account-setup',
        title: 'Salary account setup',
        description: 'Salary rollout account activation (PayrollAccountSetup).',
    },
    {
        slug: 'account-progress',
        title: 'Account activation progress',
        description: 'Application → account creation → sharing details (PayrollAccountProgress).',
    },
    {
        slug: 'wps-registration',
        title: 'WPS registration',
        description: 'Wage Protection System registration (WpsRegistration).',
    },
    {
        slug: 'hr-settings',
        title: 'HR settings',
        description:
            'Company profile, payroll cycle, salary components, leave, bank, subscription (OrganizationSettings).',
    },
    {
        slug: 'ess-settings',
        title: 'ESS settings',
        description:
            'Enable the ESS portal, required onboarding documents, attendance rules (EssSettings).',
    },
    {
        slug: 'compliance-settings',
        title: 'Compliance settings',
        description: 'EPF, ESI, professional tax, LWF and TDS (ComplianceSettings).',
    },
    {
        slug: 'add-employee',
        title: 'Add existing employee',
        description: 'Personal → employment → salary details (EmployeeOnboardPage).',
    },
    {
        slug: 'add-new-hire',
        title: 'Add new hire',
        description: 'Basic details → salary → offer letter e-sign (AddNewHire).',
    },
    {
        slug: 'bulk-upload',
        title: 'Bulk upload',
        description: 'Review and create employees from an uploaded sheet (EmployeeBulkUpload).',
    },
    {
        slug: 'invite-to-ess',
        title: 'Invite to ESS',
        description: 'Share the ESS invite (set-password link) with an employee (EssInviteModal).',
    },
    {
        slug: 'employee-added',
        title: 'Employee added',
        description: 'Confirmation after an employee is onboarded (EmployeeOnboardSuccessPage).',
    },
];

export const ESS_ONBOARDING_STEPS: OnboardingStep[] = [
    {
        slug: 'set-password',
        title: 'Set password',
        description:
            'Invite link landing (/set-password). Add ?demo=expired to see the expired-link view.',
    },
    {
        slug: 'password-updated',
        title: 'Password set',
        description: 'Confirmation after the password is set (PasswordUpdateSuccess).',
    },
    {
        slug: 'profile-completion',
        title: 'Profile completion',
        description: 'First login: welcome → documents → bank → emergency contact → done.',
    },
];
