import { useEffect, useRef, useState } from 'react';

import { Button, Col, Flex, Row, Tabs } from 'antd';
import { Formik, useFormikContext } from 'formik';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { deleteEmployee } from '../api/employeeApi/index';
import { reviseSalaryApi } from '../api/organizationSettings/index';
import {
    BasicDetailsStep,
    NEW_HIRE_STEPS,
    OfferLetterStep,
    ProfilePictureUpload,
    SalaryStep,
    newHireInitialValues,
    submitNewHireDeductions,
    submitNewHireSalary,
    useNewHireCtcSalary,
} from '../components/NewHire/NewHireSteps';
import { SignerValues } from '../components/NewHire/OfferLetterSignerCard';
import { SignatureField } from '../components/NewHire/PDFViewer';
import { useCreateNewHire } from '../hooks/employeeHooks/useCreateNewHire';
import { useValidateEmployeeApi } from '../hooks/employeeHooks/useGetValidateEmployeeInfoApi';
import { useSendOfferLetterForESign } from '../hooks/employeeHooks/useSendOfferLetterForESign';
import { getNewHireValidationSchema } from '../schema/newHireSchema';
import { offerLetterSignerSchema } from '../schema/offerLetterSignerSchema';

type NewHireStep = 0 | 1 | 2;
type NewHireFormValues = typeof newHireInitialValues;

type NewHireFormBodyProps = {
    step: NewHireStep;
    setStep: React.Dispatch<React.SetStateAction<NewHireStep>>;
    onCancel: () => void;
    onSubmitted: () => void;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString() ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const NewHireFormBody = ({ step, setStep, onCancel, onSubmitted }: NewHireFormBodyProps) => {
    const { values, validateForm, setTouched } = useFormikContext<NewHireFormValues>();
    const dispatch = useAppDispatch();
    const { submitNewHire, isSubmitting } = useCreateNewHire();
    const { validateEmployee, isLoading: isValidatingEmail } = useValidateEmployeeApi();
    const { sendOfferLetter } = useSendOfferLetterForESign();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const salary = useNewHireCtcSalary();
    // Covers the whole submit (salary/deduction POSTs + create) so the button disables
    // immediately, before useCreateNewHire's own isSubmitting kicks in — otherwise a
    // double-click can fire submitNewHireSalary twice.
    const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);

    const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);
    const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
    const [signerValues, setSignerValues] = useState<SignerValues>({
        name: '',
        email: '',
        phone: '',
    });
    const [signerExpanded, setSignerExpanded] = useState(true);

    // Prefill the signer card once the user actually reaches this step (so Basic
    // Details is fully filled in by then), not on every keystroke while on step 0.
    const hasPrefilledSigner = useRef(false);
    useEffect(() => {
        if (step !== 2 || hasPrefilledSigner.current) return;
        hasPrefilledSigner.current = true;
        setSignerValues(prev => ({
            ...prev,
            name: `${values.firstName} ${values.lastName}`.trim(),
            email: values.email,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const handleFinalSubmit = async () => {
        setIsFinalSubmitting(true);
        // Earnings are linked by email — the employee record doesn't exist yet.
        await submitNewHireSalary(salary.breakdown, values.email, userId, userType);

        let offerLetterDoc;
        if (offerLetterFile) {
            const dataUrl = await readFileAsDataUrl(offerLetterFile);
            offerLetterDoc = { base64: dataUrl.split(',')[1] ?? '', format: 'pdf' };
        }

        const result = await submitNewHire({
            personalInformation: {
                fullName: `${values.firstName} ${values.lastName}`.trim(),
                gender: values.gender,
                dateOfBirth: values.dateOfBirth,
                mobileNo: values.mobileNo,
                email: values.email,
                country: values.country,
            },
            profileImage: values.profileImage
                ? `data:image/${values.profileImageFormat};base64,${values.profileImage}`
                : undefined,
            employeeInformation: {
                designation: values.designation,
                department: values.department,
                dateOfJoin: values.dateOfJoin,
                taxRegime: salary.taxRegime,
            },
            offerLetterDoc,
        });

        setIsFinalSubmitting(false);

        if (!result.success) return;

        const newEmployeeId = result.data?.data?.id;
        // Deductions need a real employee id (unlike earnings, linked by email above), so
        // this only runs once the employee record actually exists.
        if (newEmployeeId) {
            await submitNewHireDeductions(salary.breakdown, newEmployeeId, userId, userType);

            // Records the entered Annual CTC as this employee's actually-committed figure
            // (a SalaryStructureVersion, effective from their join month) rather than
            // leaving the Salary Structure tab to reconstruct an approximation of it from
            // currently-resolved earnings on every view — lossy for a percentage-only
            // structure (Basic "% of Gross", HRA "% of Basic") with no FIXED anchor, and
            // compounds further each time it's viewed and re-persisted.
            const joinDate = new Date(values.dateOfJoin);
            const effective = Number.isNaN(joinDate.getTime()) ? new Date() : joinDate;
            const revision = await reviseSalaryApi({
                userId,
                userType,
                employeeId: newEmployeeId,
                newAnnualCTC: salary.annualCTC,
                effectiveMonth: effective.getMonth() + 1,
                effectiveYear: effective.getFullYear(),
                reason: 'Initial hire',
                isInitialHire: true,
            });

            if (!revision.success) {
                // The Next button at step 1 already blocks on salary.breakdown.isOverBudget,
                // so reaching a rejected CTC here means something changed server-side
                // between that check and submit — rare, but shouldn't leave a half-set-up
                // new hire behind (see SalaryInfo.tsx's identical rollback).
                await deleteEmployee({ userId, userType, idToDelete: newEmployeeId });
                dispatch(
                    showToast({
                        description: `Could not set up salary: ${revision.errorMessage}. The new hire was not created — adjust the CTC or components and try again.`,
                        variant: 'error',
                    })
                );
                onSubmitted();
                return;
            }

            dispatch(
                showToast({ description: 'New hire added successfully.', variant: 'success' })
            );
        }

        if (offerLetterFile) {
            const fullName = `${values.firstName} ${values.lastName}`.trim();
            // Fire-and-forget: send for e-sign in the background, don't block the redirect on it.
            sendOfferLetter({
                employeeId: newEmployeeId,
                docketTitle: `Offer Letter - ${fullName}`,
                file: offerLetterFile,
                signatureFields,
                signerValues,
            });
        }

        onSubmitted();
    };

    const handleNext = async () => {
        if (isFinalSubmitting || isValidatingEmail) return;

        // Validate against the CTC calculator's own state, not Formik's values — salary is
        // tracked entirely outside Formik here (mirrors SalaryInfo.tsx's Annual CTC gate).
        if (step === 1) {
            if (!salary.annualCTC) {
                dispatch(
                    showToast({ description: 'Please enter the Annual CTC.', variant: 'error' })
                );
                return;
            }
            if (salary.breakdown.isOverBudget) {
                dispatch(
                    showToast({
                        description:
                            "This CTC is too low to cover the configured earnings (Basic, HRA, fixed allowances, etc.) — reduce a component's amount or increase the CTC.",
                        variant: 'error',
                    })
                );
                return;
            }
            setStep(2);
            return;
        }

        // Offer letter file + signer details + placed signature are tracked in
        // local state (not Formik), so they're validated here instead.
        if (step === 2) {
            if (!offerLetterFile) {
                dispatch(
                    showToast({ description: 'Please upload the offer letter.', variant: 'error' })
                );
                return;
            }
            try {
                await offerLetterSignerSchema.validate(signerValues, { abortEarly: false });
            } catch {
                setSignerExpanded(true);
                dispatch(
                    showToast({ description: 'Please fill the signer details.', variant: 'error' })
                );
                return;
            }
            if (!signatureFields.some(f => f.signerIndex === 0)) {
                dispatch(
                    showToast({
                        description: 'Please place the signature field on the document.',
                        variant: 'error',
                    })
                );
                return;
            }
            await handleFinalSubmit();
            return;
        }

        const errors = await validateForm();
        if (Object.keys(errors).length > 0) {
            setTouched(Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
            return;
        }

        // Basic Details is the only step carrying identity fields (email/mobile) — check
        // for a duplicate against an EXISTING employee here, mirroring PersonalInformation
        // .tsx's own Add Employee flow exactly (same hook, same payload shape, same
        // backend-driven error message) so a new hire can't silently reuse someone else's
        // email/mobile number undetected until the final submit fails.
        if (step === 0) {
            const validationPayload = { email: values.email, mobileNo: values.mobileNo };
            const result = await validateEmployee(validationPayload);
            if (!result?.data?.status) return;
        }

        setStep(prev => (prev + 1) as NewHireStep);
    };

    return (
        <Flex vertical gap={16}>
            <ProfilePictureUpload />
            <Tabs
                activeKey={String(step)}
                centered
                items={NEW_HIRE_STEPS.map((label, index) => ({
                    key: String(index),
                    label,
                    disabled: index > step,
                    children: null,
                }))}
                onChange={() => {}}
            />

            {step === 0 && <BasicDetailsStep />}
            {step === 1 && <SalaryStep salary={salary} />}
            {step === 2 && (
                <OfferLetterStep
                    file={offerLetterFile}
                    setFile={setOfferLetterFile}
                    signatureFields={signatureFields}
                    setSignatureFields={setSignatureFields}
                    signerValues={signerValues}
                    setSignerValues={setSignerValues}
                    signerExpanded={signerExpanded}
                    setSignerExpanded={setSignerExpanded}
                />
            )}

            <Row justify="end" gutter={12}>
                <Col>
                    <Button
                        onClick={() =>
                            step === 0 ? onCancel() : setStep(prev => (prev - 1) as NewHireStep)
                        }
                    >
                        {step === 0 ? 'Cancel' : 'Back'}
                    </Button>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        danger
                        loading={isFinalSubmitting || isSubmitting || isValidatingEmail}
                        disabled={isFinalSubmitting || isSubmitting || isValidatingEmail}
                        onClick={handleNext}
                    >
                        {step === 2 ? 'Submit' : 'Next'}
                    </Button>
                </Col>
            </Row>
        </Flex>
    );
};

const AddNewHire = () => {
    const [step, setStep] = useState<NewHireStep>(0);
    const navigate = useNavigate();

    const goToEmployees = () =>
        navigate(`/${paths.payroll.index}/${paths.payroll.employees}?tab=2`);

    return (
        <div className={`w-full mx-auto py-6 sm:px-6 ${step === 2 ? '' : 'max-w-5xl'}`}>
            <Formik
                initialValues={newHireInitialValues}
                validationSchema={getNewHireValidationSchema(step)}
                onSubmit={() => {}}
            >
                <NewHireFormBody
                    step={step}
                    setStep={setStep}
                    onCancel={goToEmployees}
                    onSubmitted={goToEmployees}
                />
            </Formik>
        </div>
    );
};

export default AddNewHire;
