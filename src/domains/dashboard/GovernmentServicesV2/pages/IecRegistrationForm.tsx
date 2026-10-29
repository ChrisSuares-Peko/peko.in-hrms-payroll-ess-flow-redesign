import { useState } from 'react';

import { Button, Flex, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { VendorBusiness, VendorDirector, VendorServiceDocument, submitGovernmentServiceApplicationApi, uploadVendorServiceDocumentApi } from '../apis';
import { submitIecFilingApi } from '../apis/iec';
import IecApplicationDetailsStep from '../components/iec/IecApplicationDetailsStep';
import IecDocumentsStep from '../components/iec/IecDocumentsStep';
import IecReviewStep from '../components/iec/IecReviewStep';
import RelationshipManagerCard from '../components/RelationshipManagerCard';
import StepProgress from '../components/StepProgress';
import AddVendorDirectorModal from '../components/vendorDirector/AddVendorDirectorModal';
import useIecApplicationData from '../hooks/useIecApplicationData';
import { iecApplicationDetailsSchema } from '../schema';
import { IecApplicantDetailsValues } from '../types';
import { EMPTY_IEC_VALUES, IEC_STEP_TITLES } from '../utils/iecForm';
import { directorDisplayName, directorOptionValue, relationshipOptionsForEntityType } from '../utils/vendorDirector';

const { Title, Text } = Typography;

// Import Export Code. Structure mirrors TrademarkObjectionForm.tsx (Formik owns the values, step
// components are presentational, handlers live in this page). IEC now has the same vendor-
// business/payment step as Trademark Registration/Objection — ServiceDetail/ServiceCard route
// here only after that payment completes. Filing submits the SmartForm payload directly (no
// OTP/email confirmation step) via purchase's submitIecFilingV2 (buildIecSmartFormBody), same
// pattern as Trademark's own submitTrademarkFilingV2. "Load Filing Status"/Overview tracking beyond
// "filed" is out of scope — see purchase's getIecFilingStatus, which deliberately always returns
// "No Status Available".
const IecRegistrationForm = () => {
    const dispatch = useAppDispatch();
    const {
        userId,
        role,
        navigate,
        selectedService,
        isFetchingService,
        applicationRowId,
        gid,
        engagementId,
        hasCheckedDraft,
        currentStep,
        setCurrentStep,
        initialValues,
        businessName,
        setBusinessName,
        businesses,
        isLoadingBusinesses,
        importExportOptions,
        isLoadingImportExportOptions,
        iecGoods,
        iecServices,
        directors,
        isLoadingDirectors,
        isSavingDirector,
        loadDirectors,
        addDirector,
        vendorDocuments,
        isLoadingDocuments,
        uploadedDocuments,
        setUploadedDocuments,
    } = useIecApplicationData();

    const [isPreviewConfirmed, setIsPreviewConfirmed] = useState(false);
    const [uploadingDocNids, setUploadingDocNids] = useState<Record<string, boolean>>({});
    const [documentErrors, setDocumentErrors] = useState<Record<string, string>>({});

    const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
    const [isSubmittingFiling, setIsSubmittingFiling] = useState(false);

    const businessOptions = businesses.map((b) => ({ label: b.business_name, value: String(b.application_id) }));
    const directorOptions = directors.map((d, i) => ({ label: directorDisplayName(d), value: directorOptionValue(d, i) }));

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

    const handleFileSelect = async (doc: VendorServiceDocument, file: File) => {
        if (!applicationRowId || !selectedService?.accessKey) return;
        const nid = String(doc.document_Nid);
        const reader = new FileReader();
        reader.onload = async () => {
            if (typeof reader.result !== 'string') return;
            const base64 = reader.result.split(',')[1];

            setUploadingDocNids((prev) => ({ ...prev, [nid]: true }));
            const uploaded = await uploadVendorServiceDocumentApi(
                userId,
                role,
                selectedService.accessKey,
                applicationRowId,
                doc.document_Nid,
                doc.doc_name,
                base64,
                file.name
            );
            setUploadingDocNids((prev) => ({ ...prev, [nid]: false }));
            if (uploaded) {
                setDocumentErrors((prev) => {
                    const next = { ...prev };
                    delete next[nid];
                    return next;
                });
                setUploadedDocuments((prev) => ({
                    ...prev,
                    [nid]: { fileUrl: uploaded.fileUrl, fileName: file.name, docName: doc.doc_name },
                }));
                dispatch(showToast({ description: `${doc.doc_name} uploaded successfully.`, variant: 'success' }));
            } else {
                dispatch(showToast({ description: `Unable to upload ${doc.doc_name}. Please try again.`, variant: 'error' }));
            }
        };
        reader.readAsDataURL(file);
    };

    const openAddDirector = () => {
        setIsDirectorModalOpen(true);
    };

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                <Flex vertical gap={4}>
                    <Title level={4} className="!mb-0">
                        {selectedService.name}
                    </Title>
                    <Text style={{ color: '#8C8C8C' }} className="text-sm">
                        Step {currentStep + 1} of {IEC_STEP_TITLES.length}: {IEC_STEP_TITLES[currentStep]}
                    </Text>
                </Flex>

                <StepProgress steps={IEC_STEP_TITLES} currentStep={currentStep} />

                <Formik<IecApplicantDetailsValues>
                    initialValues={{ ...EMPTY_IEC_VALUES, ...initialValues }}
                    validationSchema={currentStep === 0 ? iecApplicationDetailsSchema : undefined}
                    onSubmit={() => {}}
                    enableReinitialize
                >
                    {({ values, validateForm, setTouched, setErrors, setFieldValue }) => {
                        // Same mechanism as Trademark's applyBusinessToValues — picking a business
                        // prefills Entity Type (still editable after) and the business name shown
                        // in the preview. Also loads that business's own vendor directors (View
                        // Business) for the Authorized Person picker below, same as the user asked
                        // for — a different business means a different directors pool, so any
                        // previously picked person is cleared.
                        const onSelectBusiness = (business: VendorBusiness | undefined) => {
                            if (!business) return;
                            setFieldValue('entityType', business.constitution ?? '');
                            setFieldValue('authorizedPersonId', '');
                            setFieldValue('authorizedPerson', '');
                            setBusinessName(business.business_name ?? '');
                            loadDirectors(business.application_id);
                        };

                        const onSelectDirector = (directorId: string) => {
                            const index = directors.findIndex((d, i) => directorOptionValue(d, i) === directorId);
                            const director = directors[index];
                            setFieldValue('authorizedPersonId', directorId);
                            setFieldValue('authorizedPerson', director ? directorDisplayName(director) : '');
                        };

                        const handleSaveDirector = async (director: VendorDirector) => {
                            if (!gid || !values.businessApplicationId) {
                                dispatch(showToast({ description: 'Please select a business first.', variant: 'warning' }));
                                return;
                            }
                            const saved = await addDirector(director, gid, values.businessApplicationId);
                            if (!saved) {
                                dispatch(showToast({ description: 'Unable to add the director. Please try again.', variant: 'error' }));
                                return;
                            }
                            dispatch(showToast({ description: 'Director added successfully.', variant: 'success' }));
                            setIsDirectorModalOpen(false);
                            if (saved.peopleId) {
                                setFieldValue('authorizedPersonId', saved.peopleId);
                                setFieldValue('authorizedPerson', directorDisplayName(director));
                            }
                        };

                        const handleNext = async () => {
                            const validationErrors = await validateForm();
                            if (Object.keys(validationErrors).length > 0) {
                                const touchedFields = Object.keys(EMPTY_IEC_VALUES).reduce<Record<string, boolean>>(
                                    (acc, key) => ({ ...acc, [key]: true }),
                                    {}
                                );
                                setTouched(touchedFields, false);
                                setErrors(validationErrors);
                                return;
                            }

                            // Doc §8 — valid fields but missing required documents: save and stay,
                            // withholding filing until they're uploaded.
                            if (currentStep === 1) {
                                const missingDocs = vendorDocuments.filter((doc) => !uploadedDocuments[String(doc.document_Nid)]);
                                if (missingDocs.length > 0) {
                                    setDocumentErrors(
                                        missingDocs.reduce<Record<string, string>>(
                                            (acc, doc) => ({ ...acc, [String(doc.document_Nid)]: `${doc.doc_name} is required` }),
                                            {}
                                        )
                                    );
                                    dispatch(
                                        showToast({
                                            description:
                                                'Your information has been successfully saved. Please upload the required documents to proceed with filing.',
                                            variant: 'info',
                                        })
                                    );
                                    return;
                                }
                            }

                            const nextStep = currentStep + 1;
                            if (selectedService?.accessKey && applicationRowId) {
                                await submitGovernmentServiceApplicationApi({
                                    userId,
                                    userType: role,
                                    accessKey: selectedService.accessKey,
                                    applicationId: applicationRowId,
                                    formData: { iecForm: values, currentStep: nextStep },
                                });
                            }
                            setCurrentStep(nextStep);
                        };

                        // Doc §4.2 "Split Goods and Services" — the vendor wants Import/Export
                        // Details' selections split by which live dropdown list they came from, even
                        // though the SmartForm shows them as one merged multi-select.
                        const splitGoodsAndServices = (selected: string[]) => ({
                            goods: selected.filter((item) => iecGoods.includes(item)),
                            services: selected.filter((item) => iecServices.includes(item)),
                        });

                        const handleFileApplication = async () => {
                            if (!applicationRowId) return;
                            const importSplit = splitGoodsAndServices(values.importDetails);
                            const exportSplit = splitGoodsAndServices(values.exportDetails);

                            setIsSubmittingFiling(true);
                            const result = await submitIecFilingApi(userId, role, applicationRowId, {
                                businessApplicationId: values.businessApplicationId,
                                entityType: values.entityType,
                                salutation: values.salutation,
                                authorizedPersonId: values.authorizedPersonId,
                                authorizedPerson: values.authorizedPerson,
                                preferredSectors: values.preferredSectors,
                                importDetails: values.importDetails,
                                exportDetails: values.exportDetails,
                                importGoods: importSplit.goods,
                                importServices: importSplit.services,
                                exportGoods: exportSplit.goods,
                                exportServices: exportSplit.services,
                            });
                            setIsSubmittingFiling(false);

                            if (!result) {
                                dispatch(showToast({ description: 'Unable to file the application. Please try again.', variant: 'error' }));
                                return;
                            }

                            dispatch(showToast({ description: result.message || 'Your Application has been filed successfully.', variant: 'success' }));
                            navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.tracking}`, {
                                state: {
                                    application: {
                                        id: result.applicationId ?? applicationRowId,
                                        applicationId: null,
                                        engagementId,
                                        status: 'COMPLETED',
                                        paymentStatus: 'COMPLETED',
                                        createdOn: new Date().toISOString(),
                                        serviceName: selectedService.name,
                                        legalBusinessName: businessName,
                                    },
                                },
                            });
                        };

                        return (
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                                <div className="flex-1 min-w-0 flex flex-col gap-5">
                                    {currentStep === 2 ? (
                                        <IecReviewStep
                                            values={values}
                                            businessName={businessName}
                                            authorizedPersonLabel={values.authorizedPerson}
                                            isPreviewConfirmed={isPreviewConfirmed}
                                            isSubmitting={isSubmittingFiling}
                                            onConfirmChange={setIsPreviewConfirmed}
                                            onEdit={(step) => {
                                                setCurrentStep(step);
                                                setIsPreviewConfirmed(false);
                                            }}
                                            onBack={() => setCurrentStep(currentStep - 1)}
                                            onFileApplication={handleFileApplication}
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
                                                {currentStep === 0 && (
                                                    <IecApplicationDetailsStep
                                                        businessOptions={businessOptions}
                                                        businesses={businesses}
                                                        isLoadingBusinesses={isLoadingBusinesses}
                                                        importExportOptions={importExportOptions}
                                                        isLoadingImportExportOptions={isLoadingImportExportOptions}
                                                        directorOptions={directorOptions}
                                                        isLoadingDirectors={isLoadingDirectors}
                                                        onSelectBusiness={onSelectBusiness}
                                                        onSelectDirector={onSelectDirector}
                                                        onAddDirector={openAddDirector}
                                                    />
                                                )}
                                                {currentStep === 1 && (
                                                    <IecDocumentsStep
                                                        vendorDocuments={vendorDocuments}
                                                        isLoadingDocuments={isLoadingDocuments}
                                                        uploadedDocuments={uploadedDocuments}
                                                        uploadingDocNids={uploadingDocNids}
                                                        documentErrors={documentErrors}
                                                        onFileSelect={handleFileSelect}
                                                    />
                                                )}
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
                                                    Continue
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    )}
                                </div>

                                {currentStep !== 2 && (
                                    <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
                                        <RelationshipManagerCard engagementId={engagementId} />
                                    </aside>
                                )}

                                <AddVendorDirectorModal
                                    isOpen={isDirectorModalOpen}
                                    isSaving={isSavingDirector}
                                    relationshipOptions={relationshipOptionsForEntityType(values.entityType)}
                                    onCancel={() => setIsDirectorModalOpen(false)}
                                    onSave={handleSaveDirector}
                                />
                            </div>
                        );
                    }}
                </Formik>
            </div>
        </div>
    );
};

export default IecRegistrationForm;
