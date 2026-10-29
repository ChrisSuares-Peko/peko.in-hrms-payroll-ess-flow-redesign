import { Flex, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import { paths } from '@src/routes/paths';

import StepProgress from '../components/StepProgress';
import TrademarkFormBody from '../components/TrademarkFormBody';
import useTrademarkApplicationData from '../hooks/useTrademarkApplicationData';
import { ApplicantDetailsValues } from '../types';
import { STEP_TITLES, STEP_VALIDATION_SCHEMAS } from '../utils/trademarkForm';

const { Title, Text } = Typography;

// Applicant Details -> Trademark Details -> Logo Upload -> Preview. Page data (draft/business
// resolution) lives in useTrademarkApplicationData; the Formik-bound step handlers live in
// useTrademarkFormActions, called from TrademarkFormBody (see its own comment for why that
// can't just be inline here).
const TrademarkRegistrationForm = () => {
    const {
        userId,
        role,
        selectedService,
        isFetchingService,
        businesses,
        isLoadingBusinesses,
        currentStep,
        setCurrentStep,
        logoFileName,
        setLogoFileName,
        languageOptions,
        lastLookedUpPincode,
        applicationNumber,
        engagementId,
        applicationRowId,
        initialValues,
        goBack,
        navigate,
    } = useTrademarkApplicationData();

    if (isFetchingService) {
        return <Skeleton active paragraph={{ rows: 10 }} className="p-4" />;
    }

    if (!selectedService) {
        navigate(`${paths.dashboard.governmentServices}/explore`);
        return null;
    }

    if (isLoadingBusinesses) {
        return <Skeleton active paragraph={{ rows: 10 }} className="p-4" />;
    }

    const businessOptions = businesses.map((b) => ({ label: b.business_name, value: String(b.application_id) }));

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                <Flex vertical gap={4}>
                    <Title level={4} className="!mb-0">
                        {selectedService.name} - Application
                    </Title>
                    <Text style={{ color: '#8C8C8C' }} className="text-sm">
                        Step {currentStep + 1} of {STEP_TITLES.length}: {STEP_TITLES[currentStep]}
                    </Text>
                </Flex>

                <StepProgress steps={STEP_TITLES} currentStep={currentStep} />

                <Formik<ApplicantDetailsValues>
                    initialValues={initialValues}
                    validationSchema={STEP_VALIDATION_SCHEMAS[currentStep]}
                    onSubmit={() => {}}
                >
                    {({ values, validateForm, setTouched, setErrors, setFieldValue }) => (
                        <TrademarkFormBody
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
                            businesses={businesses}
                            businessOptions={businessOptions}
                            currentStep={currentStep}
                            setCurrentStep={setCurrentStep}
                            logoFileName={logoFileName}
                            setLogoFileName={setLogoFileName}
                            lastLookedUpPincode={lastLookedUpPincode}
                            languageOptions={languageOptions}
                            navigate={navigate}
                            goBack={goBack}
                        />
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default TrademarkRegistrationForm;
