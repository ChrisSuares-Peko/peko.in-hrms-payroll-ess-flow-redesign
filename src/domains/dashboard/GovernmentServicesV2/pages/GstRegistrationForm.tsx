import { Flex, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import { paths } from '@src/routes/paths';

import GstFormBody from '../components/GstFormBody';
import StepProgress from '../components/StepProgress';
import useGstApplicationData from '../hooks/useGstApplicationData';
import { GstApplicationValues } from '../types';
import { GST_STEP_TITLES, GST_STEP_VALIDATION_SCHEMAS } from '../utils/gstForm';

const { Title, Text } = Typography;

// Applicant Details -> Address Details -> GST Information (GST_Registration.pdf §G). Page data
// (draft/business resolution) lives in useGstApplicationData; the Formik-bound step handlers live
// in useGstFormActions, called from GstFormBody — same split TrademarkRegistrationForm.tsx uses.
const GstRegistrationForm = () => {
    const {
        userId,
        role,
        selectedService,
        isFetchingService,
        isLoadingBusiness,
        currentStep,
        setCurrentStep,
        applicationNumber,
        engagementId,
        applicationRowId,
        initialValues,
        goBack,
        navigate,
    } = useGstApplicationData();

    if (isFetchingService) {
        return <Skeleton active paragraph={{ rows: 10 }} className="p-4" />;
    }

    if (!selectedService) {
        navigate(`${paths.dashboard.governmentServices}/explore`);
        return null;
    }

    if (isLoadingBusiness) {
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
                        Step {currentStep + 1} of {GST_STEP_TITLES.length}:{' '}
                        {GST_STEP_TITLES[currentStep]}
                    </Text>
                </Flex>

                <StepProgress steps={GST_STEP_TITLES} currentStep={currentStep} />

                <Formik<GstApplicationValues>
                    initialValues={initialValues}
                    validationSchema={GST_STEP_VALIDATION_SCHEMAS[currentStep]}
                    onSubmit={() => {}}
                >
                    {({ values, setFieldValue, validateForm, setTouched, setErrors }) => (
                        <GstFormBody
                            values={values}
                            setFieldValue={setFieldValue}
                            validateForm={validateForm}
                            setTouched={setTouched}
                            setErrors={setErrors}
                            userId={userId}
                            role={role}
                            selectedService={selectedService}
                            applicationRowId={applicationRowId}
                            applicationNumber={applicationNumber}
                            engagementId={engagementId}
                            currentStep={currentStep}
                            setCurrentStep={setCurrentStep}
                            navigate={navigate}
                            goBack={goBack}
                        />
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default GstRegistrationForm;
