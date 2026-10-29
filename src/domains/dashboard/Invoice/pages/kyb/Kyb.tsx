/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';

import { Button, Flex, Typography, Form, Alert, Progress, Skeleton, Radio } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import TextInput from '@components/atomic/inputs/TextInput';
import IFrameModal from '@components/molecular/modals/IFrameModal';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import KYBSteps from '../../components/kyb/KYBSteps';
import useKYBStepUpdate from '../../hooks/useKYBStepUpdate';
import useUserAgrement from '../../hooks/useUserAgrement';
import { updateSignerValidation } from '../../schema';

const Kyb = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useAppSelector(store => store.reducer.user);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [businessType, setBusinessType] = useState('');
    const {
        collectorKyb: { kybRejectReason },
    } = useAppSelector(state => state.reducer.invoices);

    const showPreview = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleRadioChange = (e: any) => {
        setBusinessType(e.target.value);
    };

    const { updateSigner, loading, agreementData, isDataLoading } = useUserAgrement();

    const viewerUrl = agreementData?.sampleAgreement || '';
    const { isFirstStepCompleted } = agreementData || {};

    const { updateStep } = useKYBStepUpdate();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [progress, setProgress] = useState(0);
    useEffect(() => {
        let interval: string | number | NodeJS.Timeout | undefined;
        if (loading) {
            setProgress(0); // Start from 0
            interval = setInterval(() => {
                setProgress(prevProgress => {
                    if (prevProgress >= 95) {
                        clearInterval(interval);
                        return 95;
                    }
                    return prevProgress + 3;
                });
            }, 100);
        } else {
            setProgress(0); // Reset to 0 when loading stops
        }

        return () => clearInterval(interval);
    }, [isFirstStepCompleted, loading, navigate]);

    if (isDataLoading) {
        return <Skeleton />;
    }

    const handleNextClick = async () => {
        if (!agreementData?.isSignLimitReached) {
            dispatch(
                showToast({
                    description: 'Send Document for eSign first',
                    variant: 'error',
                })
            );
            return;
        }
        if (!businessType) {
            dispatch(
                showToast({
                    description: 'Please select the business type',
                    variant: 'error',
                })
            );
            return;
        }
        setIsLoading(true);
        try {
            const response: { url?: string } = await updateStep(true, businessType);
            if (response?.url) {
                window.open(response.url, '_blank'); // Open the returned URL in a new tab
                navigate(`/${paths.invoice.index}/${paths.invoice.kybDocumentPage}`, {
                    state: { kybUrl: response.url },
                });
            } else {
                console.log('No URL returned from updateStep API');
            }
        } catch (error) {
            console.error('Error updating step', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex vertical align="center">
            <Flex vertical className="w-full" gap={15} align="center">
                <Typography.Text className="text-2xl font-medium">
                    Let’s help activate your payment link
                </Typography.Text>
                <Typography.Text className="text-lg">
                    Complete your KYB verification to activate payment links in just 48 hours
                </Typography.Text>
                <KYBSteps current={2} />
            </Flex>
            {loading ? (
                <Flex
                    vertical
                    gap={10}
                    align="center"
                    justify="center"
                    className="w-full h-64 justify-center bg-white"
                >
                    <Typography.Text className="text-xs font-normal ml-2">
                        Sending document. Please wait.
                    </Typography.Text>
                    <div className="w-2/4">
                        <Progress
                            className=""
                            percent={progress}
                            status="exception"
                            showInfo={false}
                        />
                    </div>
                </Flex>
            ) : (
                <Flex vertical className="w-20%  mt-8" justify="center">
                    <Typography.Text className="font-medium">Sign Agreement</Typography.Text>

                    <Formik
                        initialValues={{
                            email: agreementData?.signerEmail || '',
                            signerName: agreementData?.signerName || user?.companyName || '',
                            designation: agreementData?.designation || '',
                            address: agreementData?.address || '',
                            city: agreementData?.city || '',
                        }}
                        onSubmit={values => {
                            updateSigner(values);
                        }}
                        validationSchema={updateSignerValidation}
                        enableReinitialize
                    >
                        {({ handleSubmit }) => (
                            <Form onFinish={handleSubmit} className="w-full mt-5" layout="vertical">
                                <Flex
                                    className="flex-row flex-wrap"
                                    style={{
                                        gap: '10px',
                                        width: '100%',
                                    }}
                                >
                                    <Flex vertical className="">
                                        <Typography.Text style={{ fontSize: '14px' }}>
                                            Signer&apos;s Name
                                        </Typography.Text>
                                        <TextInput
                                            placeholder="Enter Signer Name"
                                            name="signerName"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                            isRequired
                                            // maxLength={40}
                                            isDisabled={agreementData?.isSignLimitReached}
                                            formItemClass="w-60"
                                            classes="w-full h-9"
                                        />
                                        <Typography.Text style={{ fontSize: '14px' }}>
                                            Designation
                                        </Typography.Text>
                                        <TextInput
                                            placeholder="Enter Designation"
                                            name="designation"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                            isRequired
                                            isDisabled={agreementData?.isSignLimitReached}
                                            formItemClass="w-60"
                                            classes="w-full h-9"
                                        />

                                        <Typography.Text style={{ fontSize: '14px' }}>
                                            City
                                        </Typography.Text>
                                        <TextInput
                                            placeholder="Enter city name"
                                            name="city"
                                            type="text"
                                            isRequired
                                            maxLength={20}
                                            formItemClass="w-40"
                                            classes="w-60 h-9"
                                            isDisabled={agreementData?.isSignLimitReached}
                                        />
                                    </Flex>

                                    {/* Email ID */}
                                    <Flex
                                        vertical
                                        style={{
                                            flex: 1,
                                        }}
                                    >
                                        <Typography.Text style={{ fontSize: '14px' }}>
                                            Email ID
                                        </Typography.Text>
                                        <TextInput
                                            placeholder="Enter Email ID"
                                            name="email"
                                            type="text"
                                            allowEmailsOnly
                                            isRequired
                                            maxLength={55}
                                            isDisabled={agreementData?.isSignLimitReached}
                                            formItemClass="w-40"
                                            classes="w-60 h-9"
                                        />
                                        <Typography.Text style={{ fontSize: '14px' }}>
                                            Address
                                        </Typography.Text>
                                        <TextInput
                                            placeholder="Enter Address"
                                            name="address"
                                            type="text"
                                            isRequired
                                            maxLength={50}
                                            formItemClass="w-40"
                                            classes="w-60 h-9"
                                            isDisabled={agreementData?.isSignLimitReached}
                                        />
                                    </Flex>
                                </Flex>

                                <Flex
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: '10px',
                                    }}
                                >
                                    <Button
                                        danger
                                        htmlType="submit"
                                        disabled={agreementData?.isSignLimitReached}
                                        loading={loading}
                                    >
                                        Send Document for eSign
                                    </Button>
                                    <Button
                                        style={{
                                            padding: '0 16px',

                                            backgroundColor: '#fff',
                                            color: '#ff4d4f',
                                            borderColor: '#ff4d4f',
                                        }}
                                        danger
                                        disabled={!viewerUrl}
                                        onClick={showPreview}
                                    >
                                        View Agreement
                                    </Button>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                    <Typography.Text className="text-xm mt-5">
                        Note: The agreement will be sent to the provided email ID for the purpose of
                        eSign.
                    </Typography.Text>
                    <Flex vertical gap={4} className="mt-7 mb-7">
                        <Typography.Text className=" mb-4">Business Type </Typography.Text>
                        <Radio.Group
                            buttonStyle="outline"
                            size="large"
                            onChange={handleRadioChange} // Handle radio button change
                        >
                            <Radio value="INDIVIDUAL" className="mt-4">
                                Individual
                            </Radio>
                            <Radio value="COMPANY">Company</Radio>
                        </Radio.Group>
                    </Flex>
                    {kybRejectReason && (
                        <Alert
                            message="You have already signed the agreement, send the document only if your KYB was rejected due to the agreement."
                            type="warning"
                            banner
                            className="mt-2 w-full"
                        />
                    )}

                    <Flex gap={10} className="mt-5 flex-col sm:flex-row">
                        <Button
                            type="primary"
                            className="px-5"
                            size="large"
                            danger
                            onClick={handleNextClick}
                        >
                            Next
                        </Button>
                        <Button
                            className="px-5"
                            size="large"
                            danger
                            htmlType="submit"
                            disabled={loading}
                            onClick={() => navigate(`/${paths.invoice.index}`)}
                        >
                            I will do it later
                        </Button>
                    </Flex>
                </Flex>
            )}

            <IFrameModal
                modalTitle="Document Preview"
                videoUrl={viewerUrl!}
                handleCancel={handleCancel}
                open={isModalVisible}
            />
        </Flex>
    );
};

export default Kyb;
