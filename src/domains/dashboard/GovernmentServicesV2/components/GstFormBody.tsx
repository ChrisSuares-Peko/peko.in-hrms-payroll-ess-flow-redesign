import { Button, Flex } from 'antd';
import { FormikErrors } from 'formik';
import { NavigateFunction } from 'react-router-dom';

import useGstFormActions from '../hooks/useGstFormActions';
import { GstApplicationValues, Service } from '../types';
import RelationshipManagerCard from './RelationshipManagerCard';
import { GST_STEP_TITLES } from '../utils/gstForm';
import GstAddressDetailsStep from './steps/GstAddressDetailsStep';
import GstApplicantDetailsStep from './steps/GstApplicantDetailsStep';
import GstDocumentsStep from './steps/GstDocumentsStep';
import GstInformationStep from './steps/GstInformationStep';
import GstReviewStep from './steps/GstReviewStep';

interface GstFormBodyProps {
    // Formik render-prop bag — hooks that need values (useGstFormActions) must live inside a real
    // component, not the <Formik> render-prop callback itself, same reason as TrademarkFormBody.
    values: GstApplicationValues;
    setFieldValue: (
        field: string,
        value: unknown,
        shouldValidate?: boolean
    ) => Promise<void | FormikErrors<GstApplicationValues>>;
    validateForm: () => Promise<FormikErrors<GstApplicationValues>>;
    setTouched: (touched: Record<string, boolean>, shouldValidate?: boolean) => void;
    setErrors: (errors: FormikErrors<GstApplicationValues>) => void;
    // From useGstApplicationData, passed straight through.
    userId: number;
    role: string;
    selectedService: Service;
    applicationRowId: number | null;
    applicationNumber: string | null;
    engagementId: string | null;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    navigate: NavigateFunction;
    goBack: () => void;
}

const GstFormBody = ({
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
    currentStep,
    setCurrentStep,
    navigate,
    goBack,
}: GstFormBodyProps) => {
    const {
        handleNext,
        isSubmittingFiling,
        handleSubmitFiling,
        statesOptions,
        circleOptions,
        commissionerateOptions,
        divisionOptions,
        rangeOptions,
        isLookingUpJurisdiction,
        handlePincodeChange,
        hsnSearchResults,
        isSearchingHsn,
        handleHsnSearch,
        hsnSelectedCodes,
        handleHsnSelectionChange,
        isUploadingDocument,
        handleDocumentFileSelect,
        handleDocumentRemove,
    } = useGstFormActions({
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
        currentStep,
        setCurrentStep,
        navigate,
    });

    const isLastStep = currentStep === GST_STEP_TITLES.length - 1;

    return (
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
                    {currentStep === 0 && <GstApplicantDetailsStep values={values} />}
                    {currentStep === 1 && (
                        <GstAddressDetailsStep
                            values={values}
                            setFieldValue={setFieldValue}
                            statesOptions={statesOptions}
                            circleOptions={circleOptions}
                            commissionerateOptions={commissionerateOptions}
                            divisionOptions={divisionOptions}
                            rangeOptions={rangeOptions}
                            isLookingUpJurisdiction={isLookingUpJurisdiction}
                            onPincodeChange={handlePincodeChange}
                        />
                    )}
                    {currentStep === 2 && (
                        <GstInformationStep
                            values={values}
                            hsnSearchResults={hsnSearchResults}
                            isSearchingHsn={isSearchingHsn}
                            onHsnSearch={handleHsnSearch}
                            hsnSelectedCodes={hsnSelectedCodes}
                            onHsnSelectionChange={handleHsnSelectionChange}
                        />
                    )}
                    {currentStep === 3 && (
                        <GstDocumentsStep
                            values={values}
                            isUploadingDocument={isUploadingDocument}
                            onFileSelect={handleDocumentFileSelect}
                            onRemove={handleDocumentRemove}
                        />
                    )}
                    {currentStep === 4 && <GstReviewStep values={values} />}
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
                    <Button
                        type="primary"
                        danger
                        size="large"
                        className="!min-w-[140px]"
                        onClick={isLastStep ? handleSubmitFiling : handleNext}
                        loading={isLastStep && isSubmittingFiling}
                    >
                        {isLastStep ? 'Submit' : 'Next'}
                    </Button>
                </Flex>
            </div>

            <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
                <RelationshipManagerCard engagementId={engagementId} />
            </aside>
        </div>
    );
};

export default GstFormBody;
