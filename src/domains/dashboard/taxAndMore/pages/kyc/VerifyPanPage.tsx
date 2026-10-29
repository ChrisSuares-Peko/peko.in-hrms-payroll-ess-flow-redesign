import { useEffect, useState } from 'react';

import {
    ArrowRightOutlined,
    CheckCircleFilled,
    InfoCircleOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Flex, Form, Typography } from 'antd';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getGstStatesApi } from '../../api/tax';
import KycPageLayout from '../../components/kyc/KycPageLayout';
import useKyc from '../../hooks/useKyc';
import { verifyPanSchema } from '../../schema';

const VerifyPanPage = () => {
    const navigate = useNavigate();
    const {
        panVerified,
        panNumber,
        fullName: savedName,
        dob: savedDob,
    } = useAppSelector(state => state.reducer.taxMore);
    const { isVerifying, verifyPan } = useKyc();
    const [gstStateOptions, setGstStateOptions] = useState<{ label: string; value: string }[]>([]);
    const [isLoadingStates, setIsLoadingStates] = useState(false);

    useEffect(() => {
        setIsLoadingStates(true);
        getGstStatesApi().then(states => {
            setGstStateOptions(states);
            setIsLoadingStates(false);
        });
    }, []);

    const handleVerify = async (values: { panNumber: string; fullName: string; dob: string; stateCode: string }) => {
        await verifyPan({
            pan: values.panNumber.trim().toUpperCase(),
            fullName: values.fullName.trim(),
            dob: values.dob,
            stateCode: values.stateCode,
        });
    };

    return (
        <KycPageLayout currentStep={0}>
            <Formik
                initialValues={{
                    panNumber: panNumber || '',
                    fullName: savedName || '',
                    dob: savedDob || '',
                    stateCode: '',
                }}
                validationSchema={verifyPanSchema}
                onSubmit={handleVerify}
            >
                {({ submitForm, values, errors, touched }) => (
                    <Flex vertical gap={26}>
                        <Flex vertical gap={4}>
                            <Typography.Title level={5} className="!mb-0 !font-semibold" style={{ color: '#1e293b' }}>
                                Verify PAN Details
                            </Typography.Title>
                            <Typography.Text className="text-sm"
                                style={{ color: '#475569' }}
                            >
                                We&apos;ll look up businesses registered under your PAN
                            </Typography.Text>
                        </Flex>

                        <Form layout="vertical" className="w-full">
                            <TextInput
                                name="panNumber"
                                label="PAN"
                                placeholder="e.g. ABCDE1234F"
                                type="text"
                                isRequired
                                maxLength={10}
                                convertToUppercase
                                readOnly={panVerified}
                            />

                            <TextInput
                                name="fullName"
                                label="Full Name"
                                placeholder="Enter Full Name (as on PAN card)"
                                type="text"
                                isRequired
                                minLength={3}
                                maxLength={50}
                                readOnly={panVerified}
                            />

                            <DatePickerInput
                                name="dob"
                                label="Date of Birth"
                                placeholder="Select Date of Birth"
                                isRequired
                                isDisabled={panVerified}
                                classes="!w-full"
                            />

                            <SelectInputWithSearch
                                name="stateCode"
                                label="State"
                                placeholder="Select your state"
                                isRequired
                                isDisabled={panVerified}
                                options={gstStateOptions}
                                loading={isLoadingStates}
                            />
                        </Form>

                        {panVerified && (
                            <Flex
                                align="flex-start"
                                gap={8}
                                className="rounded-[14px] border px-4 py-3"
                                style={{ backgroundColor: '#ecfdf5', borderColor: '#81cf92' }}
                            >
                                <CheckCircleFilled
                                    style={{
                                        color: '#43b75d',
                                        fontSize: 16,
                                        marginTop: 2,
                                        flexShrink: 0,
                                    }}
                                />
                                <Flex vertical gap={2}>
                                    <Typography.Text
                                        className="font-semibold text-sm"
                                        style={{ color: '#43b75d' }}
                                    >
                                        PAN verified successfully
                                    </Typography.Text>
                                    <Typography.Text
                                        className="text-xs"
                                        style={{ color: '#43b75d' }}
                                    >
                                        Businesses linked to your PAN have been fetched
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        )}

                        {!panVerified && (
                            <Flex
                                gap={8}
                                align="center"
                                className="rounded-lg px-4 py-3"
                                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                            >
                                <InfoCircleOutlined className="text-[#475569] flex-shrink-0" />
                                <Typography.Text className="text-xs text-[#475569]">
                                    We&apos;ll fetch all GST registrations linked to this PAN from
                                    the GST portal.
                                </Typography.Text>
                            </Flex>
                        )}

                        {panVerified ? (
                            <Button
                                type="primary"
                                danger
                                block
                                icon={<ArrowRightOutlined />}
                                iconPosition="end"
                                onClick={() =>
                                    navigate(
                                        `${paths.dashboard.taxMore}/${paths.taxMore.kycChooseBusiness}`
                                    )
                                }
                            >
                                Find my businesses
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                danger
                                block
                                loading={isVerifying}
                                disabled={
                                    values.panNumber.length < 10 ||
                                    !values.fullName.trim() ||
                                    !values.dob || !values.stateCode
                                }
                                onClick={submitForm}
                                icon={<SafetyCertificateOutlined />}
                                iconPosition="end"
                            >
                                Verify PAN
                            </Button>
                        )}
                    </Flex>
                )}
            </Formik>
        </KycPageLayout>
    );
};

export default VerifyPanPage;
