import { useRef, useState } from 'react';

import { Button, Flex, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    getVendorBusinessDetailApi,
    submitGovernmentServiceApplicationApi,
    submitTrademarkFilingApi,
} from '../apis';
import { lookupObjectionApplicationApi } from '../apis/objection';
import ExpeditedApplicationDetailsStep from '../components/expeditedTrademark/ExpeditedApplicationDetailsStep';
import ExpeditedOverviewStep from '../components/expeditedTrademark/ExpeditedOverviewStep';
import RelationshipManagerCard from '../components/RelationshipManagerCard';
import StepProgress from '../components/StepProgress';
import useExpeditedApplicationData from '../hooks/useExpeditedApplicationData';
import { expeditedApplicationDetailsSchema } from '../schema';
import { ExpeditedApplicantDetailsValues } from '../types';
import {
    deriveExpeditedApplicantName,
    EMPTY_EXPEDITED_VALUES,
    EXPEDITED_STEP_TITLES,
    isSelfSignedEntity,
} from '../utils/expeditedTrademarkForm';

const { Title, Text } = Typography;

// Expedited Trademark Registration (doc: "Expedited Trademark Registration — Work Flow").
// Structurally closest to Trademark Protection — one combined data screen driven by an existing
// application number (same TM Search API lookupObjectionApplicationApi already hits, reused here —
// the vendor endpoint is generic, not Objection-specific), no Documents step. The doc's own live
// side preview is replaced with the RM card here, same as every other Gov Services V2 form
// (ExpeditedLivePreview is still used on the Overview/confirm screen instead). The doc's Applicant
// Name and Authorized Person are both "picker" fields opening in a parent
// workspace via postMessage — Applicant Name is substituted with the vendor's own Business List,
// same as Protection's own Applicant Name; Authorized Person has no confirmed "people mapped to
// this business" API anywhere in this codebase, so it's a plain text field instead (locked and
// auto-filled to the business name for Individual/Proprietorship, per doc §2's "no separate
// authorized person" rule — otherwise the corporate types it in directly).
//
// "Draft & Continue" here only saves locally via the generic applications/save endpoint
// (applicationData.expeditedForm), same as the other three services' own step-save — Submit on the
// Overview screen files the real Expedited Smart Form (submitTrademarkFilingV2 branches on the
// catalog service name to build the Expedited-shaped payload, same as it already does for Objection).
const ExpeditedTrademarkRegistrationForm = () => {
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
        businesses,
        isLoadingBusinesses,
    } = useExpeditedApplicationData();

    const [isPreviewConfirmed, setIsPreviewConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const businessOptions = businesses.map(b => ({
        label: b.business_name,
        value: String(b.application_id),
    }));

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
                        Step {currentStep + 1} of {EXPEDITED_STEP_TITLES.length}:{' '}
                        {EXPEDITED_STEP_TITLES[currentStep]}
                    </Text>
                </Flex>

                <StepProgress steps={EXPEDITED_STEP_TITLES} currentStep={currentStep} />

                <Formik<ExpeditedApplicantDetailsValues>
                    initialValues={initialValues}
                    validationSchema={
                        currentStep === 0 ? expeditedApplicationDetailsSchema : undefined
                    }
                    onSubmit={() => {}}
                >
                    {({ values, validateForm, setTouched, setErrors, setFieldValue }) => {
                        // Doc §5 — same TM Search API flow as Objection/Protection's own Application
                        // Number lookup: brand/class come from tm_info.tm_applied_for/class.
                        const runLookup = async (applicationNumber: string) => {
                            setIsLookingUp(true);
                            const result = await lookupObjectionApplicationApi(
                                userId,
                                role,
                                applicationNumber
                            );
                            setIsLookingUp(false);
                            if (!result) {
                                setLookupError('Application details not found');
                                setFieldValue('brand', '');
                                setFieldValue('trademarkClass', '');
                                return;
                            }
                            setLookupError(null);
                            const info = result.tm_info;
                            setFieldValue('brand', info.tm_applied_for);
                            setFieldValue(
                                'trademarkClass',
                                info.class ? `Class ${info.class}` : ''
                            );
                            setErrors(await validateForm());
                        };

                        const handleApplicationNumberChange = (value: string) => {
                            if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
                            // Cleared immediately (not just once the debounced lookup below
                            // resolves) — otherwise a fast edit-then-Continue can slip through
                            // validation still carrying the previous number's own fetched brand/
                            // class, now mismatched against whatever was just typed.
                            setLookupError(null);
                            setFieldValue('brand', '');
                            setFieldValue('trademarkClass', '');
                            if (!value.trim()) {
                                // Doc §5 — clearing the Application Number resets the whole form.
                                setFieldValue('applicationDate', '');
                                setFieldValue('applicantBusinessId', '');
                                setFieldValue('applicantName', '');
                                setFieldValue('entityType', '');
                                setFieldValue('salutation', '');
                                setFieldValue('authorizedPerson', '');
                                setFieldValue('applicantAddress', '');
                                setFieldValue('declarationReason', '');
                                return;
                            }
                            lookupTimeout.current = setTimeout(() => runLookup(value), 500);
                        };

                        // Doc §2's business-picker substitute (see this file's own top comment) —
                        // fetches the full business detail (list rows don't carry trade_name) so
                        // Proprietorship can correctly build "<name> Proprietor of <trade name>".
                        // Individual/Proprietorship also auto-fill and lock Authorized Person here.
                        const handleSelectBusiness = async (applicationId: string) => {
                            setFieldValue('applicantBusinessId', applicationId);
                            const listMatch = businesses.find(
                                b => String(b.application_id) === applicationId
                            );
                            const detailResult = await getVendorBusinessDetailApi(
                                userId,
                                role,
                                applicationId
                            );
                            const detail = detailResult?.business;
                            const constitution =
                                detail?.constitution || listMatch?.constitution || '';
                            const applicantName = deriveExpeditedApplicantName({
                                business_name: detail?.business_name || listMatch?.business_name,
                                trade_name: detail?.trade_name,
                                constitution,
                            });
                            setFieldValue('entityType', constitution);
                            setFieldValue('applicantName', applicantName);
                            if (isSelfSignedEntity(constitution)) {
                                setFieldValue('authorizedPerson', applicantName);
                            }
                            setErrors(await validateForm());
                        };

                        const handleNext = async () => {
                            const validationErrors = await validateForm();
                            if (Object.keys(validationErrors).length > 0) {
                                const touchedFields = Object.keys(EMPTY_EXPEDITED_VALUES).reduce<
                                    Record<string, boolean>
                                >((acc, key) => ({ ...acc, [key]: true }), {});
                                setTouched(touchedFields, false);
                                setErrors(validationErrors);
                                return;
                            }
                            const nextStep = currentStep + 1;
                            // Saves progress under applicationData.expeditedForm (same generic
                            // applications/save endpoint the other three services use for their own
                            // applicationData.*Form) so a later "Continue application" resumes here.
                            if (selectedService?.accessKey && applicationRowId) {
                                await submitGovernmentServiceApplicationApi({
                                    userId,
                                    userType: role,
                                    accessKey: selectedService.accessKey,
                                    applicationId: applicationRowId,
                                    formData: {
                                        expeditedForm: values,
                                        currentStep: nextStep,
                                    },
                                });
                            }
                            setCurrentStep(nextStep);
                        };

                        // Files the Expedited Smart Form and marks the application COMPLETED —
                        // same endpoint/gateway call Objection's own handleSubmit uses
                        // (submitTrademarkFilingV2 branches on the catalog service name to build
                        // the Expedited-shaped payload instead).
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
                                            'Unable to submit the expedited trademark application. Please try again.',
                                        variant: 'error',
                                    })
                                );
                                return;
                            }
                            dispatch(
                                showToast({
                                    description:
                                        'Expedited trademark application submitted successfully.',
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

                        return currentStep === 1 ? (
                            <ExpeditedOverviewStep
                                values={values}
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
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                                <div className="flex-1 min-w-0 flex flex-col gap-5">
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
                                        <ExpeditedApplicationDetailsStep
                                            isLookingUp={isLookingUp}
                                            lookupError={lookupError}
                                            businessOptions={businessOptions}
                                            isLoadingBusinesses={isLoadingBusinesses}
                                            isAuthorizedPersonLocked={isSelfSignedEntity(
                                                values.entityType
                                            )}
                                            hasSelectedApplicant={Boolean(
                                                values.applicantBusinessId
                                            )}
                                            onApplicationNumberChange={
                                                handleApplicationNumberChange
                                            }
                                            onSelectBusiness={handleSelectBusiness}
                                        />
                                    </Flex>

                                    <Flex justify="end" gap={12}>
                                        <Button
                                            type="primary"
                                            danger
                                            size="large"
                                            className="!min-w-[180px]"
                                            onClick={handleNext}
                                        >
                                            Draft &amp; Continue
                                        </Button>
                                    </Flex>
                                </div>

                                <aside className="w-full lg:w-[400px] shrink-0">
                                    <RelationshipManagerCard engagementId={engagementId} />
                                </aside>
                            </div>
                        );
                    }}
                </Formik>
            </div>
        </div>
    );
};

export default ExpeditedTrademarkRegistrationForm;
