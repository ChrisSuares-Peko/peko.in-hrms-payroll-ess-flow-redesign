import { MutableRefObject, useState } from 'react';

import { Button, Flex } from 'antd';
import { FormikErrors } from 'formik';
import { NavigateFunction } from 'react-router-dom';

import { VendorBusiness } from '../apis';
import useTrademarkFormActions from '../hooks/useTrademarkFormActions';
import { ApplicantDetailsValues, Service } from '../types';
import RelationshipManagerCard from './RelationshipManagerCard';
import SimilarTrademarksModal from './SimilarTrademarksModal';
import ApplicantDetailsStep from './steps/ApplicantDetailsStep';
import LogoUploadStep from './steps/LogoUploadStep';
import TrademarkDetailsStep from './steps/TrademarkDetailsStep';
import TrademarkReviewStep from './TrademarkReviewStep';

interface TrademarkFormBodyProps {
    // Formik render-prop bag — hooks that need setFieldValue/values (useTrademarkFormActions)
    // must live inside a real component, not the <Formik> render-prop callback itself, which is
    // why this is its own component rather than inline in TrademarkRegistrationForm.tsx.
    values: ApplicantDetailsValues;
    setFieldValue: (field: string, value: unknown) => void;
    validateForm: () => Promise<FormikErrors<ApplicantDetailsValues>>;
    setTouched: (touched: Record<string, boolean>, shouldValidate?: boolean) => void;
    setErrors: (errors: FormikErrors<ApplicantDetailsValues>) => void;
    // From useTrademarkApplicationData, passed straight through.
    userId: number;
    role: string;
    selectedService: Service;
    applicationRowId: number | null;
    applicationNumber: string | null;
    engagementId: string | null;
    businesses: VendorBusiness[];
    businessOptions: { label: string; value: string }[];
    currentStep: number;
    setCurrentStep: (step: number) => void;
    logoFileName: string;
    setLogoFileName: (name: string) => void;
    lastLookedUpPincode: MutableRefObject<string>;
    languageOptions: { label: string; value: string }[];
    navigate: NavigateFunction;
    goBack: () => void;
}

const TrademarkFormBody = ({
    values,
    setFieldValue,
    validateForm,
    setTouched,
    setErrors,
    userId,
    role,
    selectedService,
    applicationRowId,
    applicationNumber,
    engagementId,
    businesses,
    businessOptions,
    currentStep,
    setCurrentStep,
    logoFileName,
    setLogoFileName,
    lastLookedUpPincode,
    languageOptions,
    navigate,
    goBack,
}: TrademarkFormBodyProps) => {
    // Gates the Preview step's submit button; unticked whenever the corporate edits a section again.
    const [isPreviewConfirmed, setIsPreviewConfirmed] = useState(false);

    const {
        applyBusinessToValues,
        handlePincodeChange,
        isLookingUpPincode,
        classDescriptions,
        isSearchingGoodsOrService,
        handleGoodsOrServiceChange,
        isSearchingSimilar,
        similarTrademarks,
        isSimilarModalOpen,
        setIsSimilarModalOpen,
        similarClassFilter,
        setSimilarClassFilter,
        handleBrandSearch,
        isUploadingLogo,
        handleLogoFile,
        removeLogoFile,
        handleNext,
        ownerName,
        isSubmittingFiling,
        handleSubmitFiling,
    } = useTrademarkFormActions({
        values,
        setFieldValue,
        validateForm,
        setTouched,
        setErrors,
        userId,
        role,
        selectedService,
        applicationRowId,
        applicationNumber,
        engagementId,
        businesses,
        currentStep,
        setCurrentStep,
        logoFileName,
        setLogoFileName,
        lastLookedUpPincode,
        navigate,
    });

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-5">
                {currentStep === 3 ? (
                    <TrademarkReviewStep
                        values={values}
                        ownerName={ownerName}
                        logoFileName={logoFileName}
                        isPreviewConfirmed={isPreviewConfirmed}
                        onConfirmChange={setIsPreviewConfirmed}
                        onEdit={(step) => {
                            setCurrentStep(step);
                            setIsPreviewConfirmed(false);
                        }}
                        onBack={() => setCurrentStep(currentStep - 1)}
                        onSubmit={handleSubmitFiling}
                        isSubmittingFiling={isSubmittingFiling}
                        engagementId={engagementId}
                    />
                ) : (
                    <>
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
                                <ApplicantDetailsStep
                                    businessOptions={businessOptions}
                                    businesses={businesses}
                                    onSelectBusiness={applyBusinessToValues}
                                    isLookingUpPincode={isLookingUpPincode}
                                    onPincodeChange={handlePincodeChange}
                                />
                            )}
                            {currentStep === 1 && (
                                <TrademarkDetailsStep
                                    values={values}
                                    setFieldValue={setFieldValue}
                                    languageOptions={languageOptions}
                                    isSearchingSimilar={isSearchingSimilar}
                                    onBrandSearch={handleBrandSearch}
                                    isSearchingGoodsOrService={isSearchingGoodsOrService}
                                    onGoodsOrServiceChange={handleGoodsOrServiceChange}
                                    classDescriptions={classDescriptions}
                                />
                            )}
                            {currentStep === 2 && (
                                <LogoUploadStep
                                    isUploadingLogo={isUploadingLogo}
                                    logoFileName={logoFileName}
                                    onFileSelect={handleLogoFile}
                                    onRemove={removeLogoFile}
                                />
                            )}
                        </Flex>

                        <Flex justify="space-between" gap={12}>
                            <Button
                                danger
                                size="large"
                                className="!min-w-[140px]"
                                onClick={currentStep === 0 ? goBack : () => setCurrentStep(currentStep - 1)}
                            >
                                Back
                            </Button>
                            <Button type="primary" danger size="large" className="!min-w-[140px]" onClick={handleNext}>
                                Next
                            </Button>
                        </Flex>
                    </>
                )}
            </div>

            {currentStep !== 3 && (
                <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
                    <RelationshipManagerCard engagementId={engagementId} />
                </aside>
            )}

            <SimilarTrademarksModal
                open={isSimilarModalOpen}
                onClose={() => setIsSimilarModalOpen(false)}
                searchTerm={values.brand}
                results={similarTrademarks}
                classFilter={similarClassFilter}
                onClassFilterChange={setSimilarClassFilter}
            />
        </div>
    );
};

export default TrademarkFormBody;
