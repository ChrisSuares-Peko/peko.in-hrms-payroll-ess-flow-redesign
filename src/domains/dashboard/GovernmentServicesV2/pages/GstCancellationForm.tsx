import { useState } from 'react';

import { Button, Flex, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { VendorDirector, submitGovernmentServiceApplicationApi, submitGstCancellationFilingApi } from '../apis';
import CancellationDetailsStep from '../components/cancellation/CancellationDetailsStep';
import CancellationReviewStep from '../components/cancellation/CancellationReviewStep';
import RelationshipManagerCard from '../components/RelationshipManagerCard';
import StepProgress from '../components/StepProgress';
import AddVendorDirectorModal from '../components/vendorDirector/AddVendorDirectorModal';
import useCancellationApplicationData from '../hooks/useCancellationApplicationData';
import { gstCancellationDetailsSchema } from '../schema';
import { GstCancellationValues } from '../types';
import { CANCELLATION_STEP_TITLES, EMPTY_CANCELLATION_VALUES } from '../utils/gstCancellationForm';
import { directorDisplayName, directorOptionValue, relationshipOptionsForEntityType } from '../utils/vendorDirector';

const { Title, Text } = Typography;

// GST Registration Cancellation (service_id 126). 2-step wizard — Cancellation Details, Review —
// same shape as TrademarkObjectionForm.tsx and for the same reason: no real API layer yet to
// justify splitting handlers into their own hook at this size. The business/GSTIN this cancels was
// already chosen pre-payment (see useCancellationApplicationData's own comment); this page only
// displays it (Business Name, GSTIN Status) in the Review step, read-only.
const GstCancellationForm = () => {
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
        vendorBusiness,
        isFetchingBusiness,
        directors,
        isSavingDirector,
        addDirector,
    } = useCancellationApplicationData();

    const [isPreviewConfirmed, setIsPreviewConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddDirectorModalOpen, setIsAddDirectorModalOpen] = useState(false);

    const directorOptions = directors.map((director, index) => ({
        label: directorDisplayName(director),
        value: directorOptionValue(director, index),
    }));
    const relationshipOptions = relationshipOptionsForEntityType(vendorBusiness?.constitution || '');

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

    const businessName = vendorBusiness?.business_name || vendorBusiness?.trade_name || '';

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                <Flex vertical gap={4}>
                    <Title level={4} className="!mb-0">
                        {selectedService.name} - Application
                    </Title>
                    <Text style={{ color: '#8C8C8C' }} className="text-sm">
                        Step {currentStep + 1} of {CANCELLATION_STEP_TITLES.length}:{' '}
                        {CANCELLATION_STEP_TITLES[currentStep]}
                    </Text>
                </Flex>

                <StepProgress steps={CANCELLATION_STEP_TITLES} currentStep={currentStep} />

                <Formik<GstCancellationValues>
                    initialValues={initialValues}
                    validationSchema={
                        currentStep === 0 ? gstCancellationDetailsSchema : undefined
                    }
                    onSubmit={() => {}}
                >
                    {({ values, validateForm, setTouched, setErrors, setFieldValue }) => {
                        const selectDirectorById = (directorId: string) => {
                            const index = directors.findIndex(
                                (director, i) => directorOptionValue(director, i) === directorId
                            );
                            if (index === -1) return;
                            setFieldValue('selectedDirectorId', directorId);
                            setFieldValue('authorizedPerson', directorDisplayName(directors[index]));
                        };

                        const handleSaveDirector = async (director: VendorDirector) => {
                            if (!vendorBusiness) return;
                            const saved = await addDirector(
                                director,
                                String(vendorBusiness.gid),
                                vendorBusiness.application_id
                            );
                            if (!saved?.peopleId) {
                                dispatch(
                                    showToast({
                                        description: 'Unable to add the authorized person. Please try again.',
                                        variant: 'error',
                                    })
                                );
                                return;
                            }
                            setFieldValue('selectedDirectorId', saved.peopleId);
                            setFieldValue(
                                'authorizedPerson',
                                [director.salutation, director.first_name, director.last_name]
                                    .filter(Boolean)
                                    .join(' ')
                            );
                            setIsAddDirectorModalOpen(false);
                        };

                        const handleNext = async () => {
                            const validationErrors = await validateForm();
                            if (Object.keys(validationErrors).length > 0) {
                                const touchedFields = Object.keys(EMPTY_CANCELLATION_VALUES).reduce<
                                    Record<string, boolean>
                                >((acc, key) => ({ ...acc, [key]: true }), {});
                                setTouched(touchedFields, false);
                                setErrors(validationErrors);
                                return;
                            }
                            const nextStep = currentStep + 1;
                            // Saves progress under applicationData.cancellationForm (same generic
                            // applications/save endpoint every other GovernmentServicesV2 flow uses)
                            // so a later "Continue application" resumes here.
                            if (selectedService?.accessKey && applicationRowId) {
                                await submitGovernmentServiceApplicationApi({
                                    userId,
                                    userType: role,
                                    accessKey: selectedService.accessKey,
                                    applicationId: applicationRowId,
                                    formData: {
                                        cancellationForm: values,
                                        currentStep: nextStep,
                                    },
                                });
                            }
                            setCurrentStep(nextStep);
                        };

                        const handleSubmit = async () => {
                            if (!selectedService?.accessKey) return;
                            setIsSubmitting(true);
                            const result = await submitGstCancellationFilingApi(
                                userId,
                                role,
                                selectedService.accessKey,
                                // gstin/businessName come from the pre-payment business selection,
                                // not the form — the vendor's smart form needs both.
                                { ...values, gstin: vendorBusiness?.gstin || '', businessName },
                                applicationRowId
                            );
                            setIsSubmitting(false);
                            if (!result) {
                                dispatch(
                                    showToast({
                                        description:
                                            'Unable to submit the cancellation request. Please try again.',
                                        variant: 'error',
                                    })
                                );
                                return;
                            }
                            dispatch(
                                showToast({
                                    description: 'Cancellation request submitted successfully.',
                                    variant: 'success',
                                })
                            );
                            navigate(
                                `${paths.dashboard.governmentServices}/${paths.governmentServices.tracking}`,
                                {
                                    state: {
                                        application: {
                                            id: result.applicationId,
                                            applicationId: values.selectedVendorBusinessId,
                                            engagementId,
                                            status: 'COMPLETED',
                                            paymentStatus: 'COMPLETED',
                                            createdOn: new Date().toISOString(),
                                            serviceName: selectedService.name,
                                            legalBusinessName: businessName,
                                        },
                                    },
                                }
                            );
                        };

                        return (
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                                <div className="flex-1 min-w-0 flex flex-col gap-5">
                                    {currentStep === 1 ? (
                                        <CancellationReviewStep
                                            values={values}
                                            businessName={businessName}
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
                                                {isFetchingBusiness ? (
                                                    <Skeleton active paragraph={{ rows: 3 }} />
                                                ) : (
                                                    <CancellationDetailsStep
                                                        directorOptions={directorOptions}
                                                        isLoadingDirectors={isFetchingBusiness}
                                                        onSelectDirector={selectDirectorById}
                                                        onAddDirector={() => setIsAddDirectorModalOpen(true)}
                                                    />
                                                )}
                                            </Flex>

                                            <AddVendorDirectorModal
                                                isOpen={isAddDirectorModalOpen}
                                                isSaving={isSavingDirector}
                                                relationshipOptions={relationshipOptions}
                                                onCancel={() => setIsAddDirectorModalOpen(false)}
                                                onSave={handleSaveDirector}
                                            />

                                            <Flex justify="end" gap={12}>
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

export default GstCancellationForm;
