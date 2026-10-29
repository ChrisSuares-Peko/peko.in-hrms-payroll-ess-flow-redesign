import { useEffect, useRef, useState } from 'react';

import { Button, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { submitGovernmentServiceApplicationApi, submitTrademarkFilingApi } from '../apis';
import { lookupObjectionApplicationApi } from '../apis/objection';
import ObjectionApplicationDetailsStep from '../components/objection/ObjectionApplicationDetailsStep';
import ObjectionReviewStep from '../components/objection/ObjectionReviewStep';
import RelationshipManagerCard from '../components/RelationshipManagerCard';
import StepProgress from '../components/StepProgress';
import useObjectionApplicationData from '../hooks/useObjectionApplicationData';
import { objectionApplicationDetailsSchema } from '../schema';
import { ObjectionApplicantDetailsValues } from '../types';
import { EMPTY_OBJECTION_VALUES, OBJECTION_STEP_TITLES } from '../utils/objectionForm';

const { Title, Text } = Typography;

// Trademark Objection. The application-number lookup (doc §5), the page's own data resolution
// (selected service, saved draft, engagement id — see useObjectionApplicationData), and Submit
// are all wired to real endpoints; Authorized Person/People API and Objection Section/Proof
// Available master data are still placeholders — see utils/objectionForm.ts and each step
// component's own TODOs. Structure mirrors TrademarkRegistrationForm/TrademarkFormBody: Formik
// owns the values, step components are presentational, handlers live in this page for now since
// there's no real API layer yet for the rest to justify splitting further.
const TrademarkObjectionForm = () => {
    const dispatch = useAppDispatch();
    const {
        userId,
        role,
        navigate,
        selectedService,
        isFetchingService,
        engagementId,
        applicationRowId,
        hasCheckedDraft,
        currentStep,
        setCurrentStep,
        initialValues,
    } = useObjectionApplicationData();

    const [isPreviewConfirmed, setIsPreviewConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [isFetched, setIsFetched] = useState(false);
    const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // A resumed draft that already has fetched fields (brand etc.) doesn't need those fields
    // re-looked-up — just unlock the rest of the step like a fresh lookup would.
    useEffect(() => {
        if (hasCheckedDraft && initialValues.brand) setIsFetched(true);
    }, [hasCheckedDraft, initialValues.brand]);

    if (isFetchingService) {
        return <Skeleton active paragraph={{ rows: 10 }} className="p-4" />;
    }

    if (!selectedService) {
        navigate(`${paths.dashboard.governmentServices}/explore`);
        return null;
    }

    if (!hasCheckedDraft) {
        return <Skeleton active paragraph={{ rows: 10 }} className="p-4" />;
    }

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                <Flex vertical gap={4}>
                    <Title level={4} className="!mb-0">
                        {selectedService.name} - Application
                    </Title>
                    <Text style={{ color: '#8C8C8C' }} className="text-sm">
                        Step {currentStep + 1} of {OBJECTION_STEP_TITLES.length}:{' '}
                        {OBJECTION_STEP_TITLES[currentStep]}
                    </Text>
                </Flex>

                <StepProgress steps={OBJECTION_STEP_TITLES} currentStep={currentStep} />

                <Formik<ObjectionApplicantDetailsValues>
                    initialValues={initialValues}
                    validationSchema={
                        currentStep === 0 ? objectionApplicationDetailsSchema : undefined
                    }
                    onSubmit={() => {}}
                >
                    {({ values, validateForm, setTouched, setErrors, setFieldValue }) => {
                        // Doc §5 — runs as the corporate types (debounced), same pattern as
                        // Trademark Registration's goods/service search. Clearing the field clears
                        // whatever was previously fetched, same as Class/Description there.
                        // Notice Date isn't part of the vendor response (see
                        // ObjectionApplicationDetailsStep's own comment) — cleared here too since a
                        // fresh application number makes whatever was typed before it stale.
                        const runLookup = async (applicationNumber: string) => {
                            setIsLookingUp(true);
                            const result = await lookupObjectionApplicationApi(
                                userId,
                                role,
                                applicationNumber
                            );
                            setIsLookingUp(false);
                            if (!result) {
                                setLookupError('No application found for this application number.');
                                setIsFetched(false);
                                setFieldValue('brand', '');
                                setFieldValue('trademarkClass', '');
                                setFieldValue('applicationDate', '');
                                setFieldValue('noticeDate', '');
                                setFieldValue('applicantName', '');
                                setFieldValue('applicantAddress', '');
                                return;
                            }
                            setLookupError(null);
                            setIsFetched(true);
                            const info = result.tm_info;
                            setFieldValue('brand', info.tm_applied_for);
                            // Vendor sends YYYY-MM-DD — shown as DD-MM-YYYY, matching Trademark
                            // Registration's own date display convention.
                            setFieldValue(
                                'applicationDate',
                                info.application_date
                                    ? dayjs(info.application_date, 'YYYY-MM-DD').format(
                                          'DD-MM-YYYY'
                                      )
                                    : ''
                            );
                            setFieldValue(
                                'trademarkClass',
                                info.class ? `Class ${info.class}` : ''
                            );
                            setFieldValue('noticeDate', '');
                            setFieldValue('applicantName', info.proprietor_name);
                            setFieldValue('applicantAddress', info.proprietor_address);
                            // A failed "Next" (before any application number was entered) leaves
                            // errors set directly via setErrors — Formik's own validateOnChange
                            // doesn't reliably re-run across this many back-to-back setFieldValue
                            // calls, so the stale "not fetched yet" messages stick around until some
                            // unrelated field change. Re-validating once against the now-filled
                            // values clears them immediately instead of waiting on that.
                            setErrors(await validateForm());
                        };

                        const handleApplicationNumberChange = (value: string) => {
                            if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
                            // Cleared immediately (not just once the debounced lookup below
                            // resolves) — otherwise a fast edit-then-Continue can slip through
                            // validation still carrying the previous number's own fetched brand/
                            // class, now mismatched against whatever was just typed.
                            setLookupError(null);
                            setIsFetched(false);
                            setFieldValue('brand', '');
                            setFieldValue('trademarkClass', '');
                            setFieldValue('applicationDate', '');
                            setFieldValue('noticeDate', '');
                            setFieldValue('applicantName', '');
                            setFieldValue('applicantAddress', '');
                            if (!value.trim()) return;
                            lookupTimeout.current = setTimeout(() => runLookup(value), 500);
                        };

                        const handleNext = async () => {
                            const validationErrors = await validateForm();
                            if (Object.keys(validationErrors).length > 0) {
                                const touchedFields = Object.keys(EMPTY_OBJECTION_VALUES).reduce<
                                    Record<string, boolean>
                                >((acc, key) => ({ ...acc, [key]: true }), {});
                                setTouched(touchedFields, false);
                                setErrors(validationErrors);
                                return;
                            }
                            const nextStep = currentStep + 1;
                            // Saves progress under applicationData.objectionForm (same generic
                            // applications/save endpoint Trademark Registration uses for its own
                            // applicationData.trademarkForm) so a later "Continue application" resumes here.
                            if (selectedService?.accessKey && applicationRowId) {
                                await submitGovernmentServiceApplicationApi({
                                    userId,
                                    userType: role,
                                    accessKey: selectedService.accessKey,
                                    applicationId: applicationRowId,
                                    formData: {
                                        objectionForm: values,
                                        currentStep: nextStep,
                                    },
                                });
                            }
                            setCurrentStep(nextStep);
                        };

                        // Files the Objection Smart Form and marks the application COMPLETED —
                        // same endpoint/gateway call Trademark Registration's own
                        // handleSubmitFiling uses (submitTrademarkFilingV2 branches on the
                        // catalog service name to build the Objection-shaped payload instead).
                        const handleSubmit = async () => {
                            if (!selectedService?.accessKey) return;
                            setIsSubmitting(true);
                            const result = await submitTrademarkFilingApi(
                                userId,
                                role,
                                selectedService.accessKey,
                                { ...values },
                                applicationRowId
                            );
                            setIsSubmitting(false);
                            if (!result) {
                                dispatch(
                                    showToast({
                                        description:
                                            'Unable to submit the objection application. Please try again.',
                                        variant: 'error',
                                    })
                                );
                                return;
                            }
                            dispatch(
                                showToast({
                                    description: 'Objection application submitted successfully.',
                                    variant: 'success',
                                })
                            );
                            navigate(
                                `${paths.dashboard.governmentServices}/${paths.governmentServices.tracking}`,
                                {
                                    state: {
                                        application: {
                                            id: result.applicationId,
                                            applicationId: values.applicationNumber,
                                            engagementId,
                                            status: 'COMPLETED',
                                            paymentStatus: 'COMPLETED',
                                            createdOn: new Date().toISOString(),
                                            serviceName: selectedService.name,
                                            legalBusinessName: values.applicantName,
                                        },
                                    },
                                }
                            );
                        };

                        return (
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                                <div className="flex-1 min-w-0 flex flex-col gap-5">
                                    {currentStep === 1 ? (
                                        <ObjectionReviewStep
                                            values={values}
                                            authorizedPersonLabel={values.authorizedPerson}
                                            isPreviewConfirmed={isPreviewConfirmed}
                                            onConfirmChange={setIsPreviewConfirmed}
                                            onEdit={step => {
                                                setCurrentStep(step);
                                                setIsPreviewConfirmed(false);
                                            }}
                                            onBack={() => setCurrentStep(currentStep - 1)}
                                            onSubmit={handleSubmit}
                                            isSubmitting={isSubmitting}
                                        />
                                    ) : (
                                        <Flex vertical gap={20}>
                                            <Flex
                                                vertical
                                                gap={20}
                                                className="p-6"
                                                style={{
                                                    border: '1px solid #F0F0F0',
                                                    backgroundColor: '#FFFFFF',
                                                    borderRadius: 20,
                                                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                                }}
                                            >
                                                <ObjectionApplicationDetailsStep
                                                    isLookingUp={isLookingUp}
                                                    lookupError={lookupError}
                                                    isFetched={isFetched}
                                                    onApplicationNumberChange={
                                                        handleApplicationNumberChange
                                                    }
                                                />
                                            </Flex>

                                            <Flex justify="space-between" gap={12}>
                                                <Button
                                                    danger
                                                    size="large"
                                                    className="!min-w-[140px]"
                                                    onClick={() => setCurrentStep(currentStep - 1)}
                                                    disabled={currentStep === 0}
                                                >
                                                    Back
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    danger
                                                    size="large"
                                                    className="!min-w-[140px]"
                                                    onClick={handleNext}
                                                >
                                                    Next
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    )}
                                </div>

                                {currentStep !== 1 && (
                                    <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
                                        <RelationshipManagerCard engagementId={engagementId} />
                                    </aside>
                                )}
                            </div>
                        );
                    }}
                </Formik>
            </div>
        </div>
    );
};

export default TrademarkObjectionForm;
