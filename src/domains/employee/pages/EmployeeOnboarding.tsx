import { useState } from 'react';

import { Flex, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import BankStep, { BankValues } from '../components/onboarding/BankStep';
import DocumentsStep, { DocumentsValues } from '../components/onboarding/DocumentsStep';
import EmergencyContactStep, {
    EmergencyValues,
} from '../components/onboarding/EmergencyContactStep';
import OnboardingStepper from '../components/onboarding/OnboardingStepper';
import OnboardingSuccess from '../components/onboarding/OnboardingSuccess';
import OnboardingWelcome from '../components/onboarding/OnboardingWelcome';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { useOnboardingSubmit } from '../hooks/useOnboardingSubmit';
import { useRequiredOnboardingDocuments } from '../hooks/useRequiredOnboardingDocuments';

type Phase = 'welcome' | 'form' | 'success';

// HR-settings catalog key for the bank document (see HrSettings.onboardingDocuments
// default catalog). When required, it's collected via the dedicated Bank step instead
// of a plain upload; otherwise the Bank step is skipped entirely.
const BANK_DOC_KEY = 'bankAccountDetails';

const initialDocuments: DocumentsValues = {};
const initialBank: BankValues = {
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
};
const initialEmergency: EmergencyValues = { fullName: '', relationship: '', phone: '' };

const EmployeeOnboarding = () => {
    const navigate = useNavigate();
    const { profile: employeeProfile } = useOnboardingStatus();
    const { submitDocuments, submitBank, submitEmergency } = useOnboardingSubmit();
    const { documents: requiredDocs, loading: docsLoading } = useRequiredOnboardingDocuments();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [step, setStep] = useState(0);
    const [documents, setDocuments] = useState<DocumentsValues>(initialDocuments);
    const [bank, setBank] = useState<BankValues>(initialBank);
    const [emergency, setEmergency] = useState<EmergencyValues>(initialEmergency);

    // The bank doc maps to the dedicated Bank step; everything else is a plain upload.
    const bankRequired = requiredDocs.some(doc => doc.key === BANK_DOC_KEY);
    const uploadDocs = requiredDocs.filter(doc => doc.key !== BANK_DOC_KEY);
    const hasUploadDocs = uploadDocs.length > 0;
    // Step order is dynamic — each step appears only when it has something to collect.
    const stepKeys = [
        ...(hasUploadDocs ? ['documents'] : []),
        ...(bankRequired ? ['bank'] : []),
        'emergency',
    ];
    const stepLabels = [
        ...(hasUploadDocs ? ['Documents'] : []),
        ...(bankRequired ? ['Bank'] : []),
        'Emergency',
    ];

    const rawName = employeeProfile?.personalInformation?.fullName?.trim() ?? '';
    const displayName = rawName ? rawName.replace(/\b\w/g, char => char.toUpperCase()) : 'there';
    const initials =
        rawName
            .split(/\s+/)
            .map(word => word[0] ?? '')
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'EM';

    const goNext = () => setStep(s => s + 1);
    const goBack = () => setStep(s => s - 1);

    if (phase === 'welcome') {
        return (
            <OnboardingWelcome
                firstName={displayName}
                initials={initials}
                showBank={bankRequired}
                showDocuments={hasUploadDocs}
                onGetStarted={() => {
                    setPhase('form');
                    setStep(0);
                }}
            />
        );
    }

    if (phase === 'success') {
        return (
            <OnboardingSuccess
                firstName={displayName}
                onGoToDashboard={() => navigate(paths.employee.home, { replace: true })}
            />
        );
    }

    // Wait for the HR-configured document list before deciding the step flow.
    if (docsLoading) {
        return (
            <Flex justify="center" align="center" className="w-full max-w-[600px] mx-auto py-16">
                <Spin />
            </Flex>
        );
    }

    const stepKey = stepKeys[step];

    return (
        <Flex vertical className="w-full max-w-[600px] mx-auto py-8">
            <OnboardingStepper steps={stepLabels} current={step} />

            {stepKey === 'documents' && (
                <DocumentsStep
                    documents={uploadDocs}
                    initialValues={documents}
                    onContinue={async values => {
                        if (uploadDocs.length === 0) {
                            setDocuments(values);
                            goNext();
                            return;
                        }
                        const ok = await submitDocuments(values, uploadDocs);
                        if (ok) {
                            setDocuments(values);
                            goNext();
                        }
                    }}
                />
            )}

            {stepKey === 'bank' && (
                <BankStep
                    initialValues={bank}
                    onContinue={async values => {
                        setBank(values);
                        goNext();
                    }}
                    onBack={
                        step > 0
                            ? values => {
                                  setBank(values);
                                  goBack();
                              }
                            : undefined
                    }
                />
            )}

            {stepKey === 'emergency' && (
                <EmergencyContactStep
                    initialValues={emergency}
                    onComplete={async values => {
                        if (bankRequired) {
                            const bankOk = await submitBank(bank);
                            if (!bankOk) return;
                        }
                        const ok = await submitEmergency(values);
                        if (ok) {
                            setEmergency(values);
                            setPhase('success');
                        }
                    }}
                    onBack={
                        step > 0
                            ? values => {
                                  setEmergency(values);
                                  goBack();
                              }
                            : undefined
                    }
                />
            )}
        </Flex>
    );
};

export default EmployeeOnboarding;
