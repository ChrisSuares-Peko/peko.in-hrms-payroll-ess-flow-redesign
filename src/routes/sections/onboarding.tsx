// PROTOTYPE-SETUP: /onboarding/payroll/* and /onboarding/ess/* render the existing onboarding screens
// step by step, reachable regardless of setup status or first-run flags.
import { lazy } from 'react';

import { Navigate } from 'react-router-dom';

import EssInviteStep from '@src/prototype/onboarding/EssInviteStep';
import OnboardingLayout from '@src/prototype/onboarding/OnboardingLayout';
import PayrollOnboardingState from '@src/prototype/onboarding/PayrollOnboardingState';
import { ESS_ONBOARDING_STEPS, PAYROLL_ONBOARDING_STEPS } from '@src/prototype/onboarding/steps';

// PROTOTYPE-SETUP: purchase step wraps the subscription landing with an "Illustrative pricing" label.
const PurchaseStep = lazy(() => import('@src/prototype/onboarding/PurchaseStep'));
const SetupWizard = lazy(() => import('@src/domains/dashboard/Payroll/pages/LandingPage'));
const PayrollAccountSetup = lazy(
    () => import('@src/domains/dashboard/Payroll/pages/PayrollAccountSetup')
);
const PayrollAccountProgress = lazy(
    () => import('@src/domains/dashboard/Payroll/pages/PayrollAccountProgress')
);
const WpsRegistration = lazy(() => import('@src/domains/dashboard/Payroll/pages/WpsRegistration'));
const OrganizationSettings = lazy(
    () => import('@src/domains/dashboard/Payroll/pages/OrganizationSettings')
);
const EssSettings = lazy(
    () => import('@src/domains/dashboard/Payroll/components/organizationSettings/EssSettings')
);
const ComplianceSettings = lazy(
    () => import('@src/domains/dashboard/Payroll/pages/complianceSettings')
);
const EmployeeOnboardPage = lazy(
    () => import('@src/domains/dashboard/Payroll/pages/EmployeeOnboardPage')
);
const AddNewHire = lazy(() => import('@src/domains/dashboard/Payroll/pages/AddNewHire'));
const EmployeeBulkUpload = lazy(
    () => import('@src/domains/dashboard/Payroll/pages/EmployeeBulkUpload')
);
const EmployeeOnboardSuccessPage = lazy(
    () => import('@src/domains/dashboard/Payroll/pages/EmployeeOnboardSuccessPage')
);

const SetPassword = lazy(() => import('@domains/auth/components/views/ResetPasswordView'));
const PasswordUpdated = lazy(() => import('@domains/auth/components/views/PasswordUpdateSuccess'));
const EmployeeOnboarding = lazy(() => import('@src/domains/employee/pages/EmployeeOnboarding'));

const payrollStepElements: Record<string, JSX.Element> = {
    purchase: <PurchaseStep />,
    'setup-wizard': <SetupWizard />,
    'account-setup': <PayrollAccountSetup />,
    'account-progress': <PayrollAccountProgress />,
    'wps-registration': <WpsRegistration />,
    'hr-settings': <OrganizationSettings />,
    'ess-settings': <EssSettings />,
    'compliance-settings': <ComplianceSettings />,
    'add-employee': <EmployeeOnboardPage />,
    'add-new-hire': <AddNewHire />,
    'bulk-upload': <EmployeeBulkUpload />,
    'invite-to-ess': <EssInviteStep />,
    'employee-added': <EmployeeOnboardSuccessPage />,
};

const essStepElements: Record<string, JSX.Element> = {
    'set-password': <SetPassword />,
    'password-updated': <PasswordUpdated />,
    'profile-completion': <EmployeeOnboarding />,
};

export const onboardingRoutes = [
    { index: true, element: <Navigate to={`payroll/${PAYROLL_ONBOARDING_STEPS[0].slug}`} replace /> },
    {
        path: 'payroll',
        element: (
            <PayrollOnboardingState>
                <OnboardingLayout flow="payroll" />
            </PayrollOnboardingState>
        ),
        children: [
            { index: true, element: <Navigate to={PAYROLL_ONBOARDING_STEPS[0].slug} replace /> },
            ...PAYROLL_ONBOARDING_STEPS.map(step => ({
                path: step.slug,
                element: payrollStepElements[step.slug],
            })),
            { path: '*', element: <Navigate to={PAYROLL_ONBOARDING_STEPS[0].slug} replace /> },
        ],
    },
    {
        path: 'ess',
        element: <OnboardingLayout flow="ess" />,
        children: [
            { index: true, element: <Navigate to={ESS_ONBOARDING_STEPS[0].slug} replace /> },
            ...ESS_ONBOARDING_STEPS.map(step => ({
                path: step.slug,
                element: essStepElements[step.slug],
            })),
            { path: '*', element: <Navigate to={ESS_ONBOARDING_STEPS[0].slug} replace /> },
        ],
    },
];
