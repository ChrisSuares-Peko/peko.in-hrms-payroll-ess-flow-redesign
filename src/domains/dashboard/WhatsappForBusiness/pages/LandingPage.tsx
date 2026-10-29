import { useCallback, useState, lazy, useEffect, useRef } from 'react';

import { Row, Col, Skeleton, Flex, Tag, Button } from 'antd';
import { Typography } from 'antd/lib';
import { Form, Formik, FormikHelpers } from 'formik';
import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import dashboardIcon from '@domains/dashboard/WhatsappForBusiness/assets/images/dashboardIcon.svg';
import subscriptionIcon from '@domains/dashboard/WhatsappForBusiness/assets/images/subscriptionIcon.svg';
import { ENV } from '@src/config-global';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formattedDateOnly } from '@utils/dateFormat';

import { initializeBundledWhatsAppProject } from '../api';
import ConversationCharges from '../components/ConversationCharges';
import RenewalOverlay from '../components/whatsappRenewal/RenewalOverlay';
import { useGenerateEmbeddedSignupURL } from '../hooks/useGenerateEmbeddedSignupURL';
import { useGetActiveSubscription } from '../hooks/useGetActiveSubscription';
import GetAllProjects from '../hooks/useGetProjects';
import useSsoLogin from '../hooks/useSSOLogin';
import useWccPayment from '../hooks/useWccPayment';
import useWhatsAppDetails from '../hooks/useWhatsappDetails';

const Features = lazy(() => import('../components/Features'));
const DashFooter = lazy(() => import('../components/DashFooter'));

const { Text } = Typography;

interface FormValues {
    amount: string;
}

const LandingPage = () => {
    // Use the GetAllProjects hook
    const { handleSsoLogin } = useSsoLogin();
    const { projectData, isLoading } = GetAllProjects();
    const { data, refresh: refreshActiveSubscription } = useGetActiveSubscription(true);
    const { generateURL, isLoading: embeddedLoading } = useGenerateEmbeddedSignupURL();
    const { subscriptionDetails } = useWhatsAppDetails();
    const { handleSubmission } = useWccPayment();
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const [isExpired, setIsExpired] = useState<boolean>(false);
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);

    // First-visit init for a Peko+ bundled WhatsApp BASIC row: only call when we actually
    // need to materialize an AiSensy project (i.e. active sub exists with projectId === 'PENDING').
    // For users who already have a real projectId (or no active sub at all), this is a no-op —
    // skip the round trip entirely so a backend hiccup doesn't surface a toast.
    const initBundleAttempted = useRef(false);
    const activeProjectId = data?.activeSubscriptions?.projectId;
    useEffect(() => {
        if (initBundleAttempted.current) return;
        if (!userId || !role) return;
        // Wait for active subscription fetch to settle so we can decide whether init is required.
        if (data === null) return;
        const needsInit = !!data?.activeSubscriptions && activeProjectId === 'PENDING';
        initBundleAttempted.current = true;
        if (!needsInit) return;
        (async () => {
            try {
                const result = await initializeBundledWhatsAppProject({ userId, userType: role });
                if (result && result.initialized) {
                    refreshActiveSubscription();
                }
            } catch {
                // Soft-fail — backend already returns 200/silent on error, but defend against
                // any future change. Dashboard stays usable; next mount will re-attempt.
            }
        })();
    }, [userId, role, data, activeProjectId, refreshActiveSubscription]);

    const handleClick = () => {
        handleSsoLogin();
    };

    const handleSubscriptionClick = () => {
        navigate(paths.whatsappForBusiness.reviewOrder);
    };

    const handleApplyNowClick = useCallback(
        async (projectId: string) => {
            try {
                const response = await generateURL(projectId);
                if (response && response.embeddedSignupURL) {
                    window.open(response.embeddedSignupURL, '_blank');
                } else {
                    console.error('Embedded signup URL is missing.');
                }
            } catch (error) {
                console.error('Error generating URL:', error);
            }
        },
        [generateURL]
    );

    const validationSchema = Yup.object().shape({
        amount: Yup.number()
            // .min(3.67, 'Amount must be at least 3.67')
            .required('Please enter the amount'),
    });

    const handleAmountChange = useCallback(
        (value: string, setFieldValue: FormikHelpers<FormValues>['setFieldValue']) => {
            const isValid = /^[0-9]*\.?[0-9]*$/.test(value);

            if (isValid) {
                setAmount(value);
                setFieldValue('amount', value); // Update Formik's value
            }
        },
        [setAmount] // Add all necessary dependencies
    );

    const handleSubmit = useCallback(
        async (values: { amount: string }) => {
            setLoading(true);
            if (projectData && projectData[0].id) {
                await handleSubmission(values.amount, projectData[0].id);
            }
            setLoading(false);
        },
        [projectData, handleSubmission] // Add necessary dependencies
    );

    return (
        <Flex vertical>
            {isLoading ? (
                <Skeleton active />
            ) : (
                <RenewalOverlay
                    subscriptionDetails={subscriptionDetails}
                    shouldBlockActions={false}
                    setIsExpired={setIsExpired}
                >
                    <Text className="font-normal text-xl md:text-3xl">WhatsApp for Business</Text>
                    <Row gutter={[15, 15]}>
                        <Col
                            xs={24}
                            sm={12}
                            lg={12}
                            xl={6}
                            className={`${isExpired ? 'pointer-events-none' : ''}`}
                        >
                            <Flex
                                vertical
                                className="mt-8 justify-between p-5 rounded-2xl"
                                gap={8}
                                justify="center"
                                style={{
                                    background: '#F9F9F9',
                                    height: '250px',
                                    overflow: 'hidden',
                                }}
                            >
                                <Flex justify="center">
                                    <Text
                                        style={{
                                            color: '#666',
                                            textAlign: 'center',
                                            lineHeight: '1.4',
                                        }}
                                    >
                                        Your subscription details
                                    </Text>
                                </Flex>
                                {projectData && projectData[0].is_whatsapp_verified ? (
                                    <Flex justify="center" gap={10}>
                                        <Flex gap={5}>
                                            <Text
                                                className="font-medium text-2xl"
                                                style={{
                                                    color: '#000',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {capitalize(
                                                    data?.activeSubscriptions?.billingPlan
                                                ) || 'N/A'}
                                            </Text>
                                        </Flex>
                                        <Flex>
                                            <Tag
                                                className={`flex text-[#363835] rounded-2xl text-center items-center mt-1 border-0 ${
                                                    projectData &&
                                                    capitalize(projectData[0].status) === 'Active'
                                                        ? 'bg-[#B8FF8C]'
                                                        : 'bg-[#FF8C8C]'
                                                }`}
                                            >
                                                {projectData &&
                                                    (capitalize(
                                                        data?.activeSubscriptions?.status
                                                    ) === 'Pending'
                                                        ? 'Purchased'
                                                        : capitalize(
                                                              data?.activeSubscriptions?.status
                                                          ))}
                                            </Tag>
                                        </Flex>
                                    </Flex>
                                ) : (
                                    <Flex justify="center" gap={10}>
                                        <Flex gap={6}>
                                            <Text
                                                className="font-medium text-2xl"
                                                style={{
                                                    color: '#000',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {capitalize(
                                                    data?.activeSubscriptions?.billingPlan
                                                ) || 'N/A'}
                                            </Text>
                                            <Flex>
                                                <Tag className="flex text-[#363835] rounded-2xl text-center items-center bg-[#B8FF8C] mt-1 border-0">
                                                    Purchased
                                                </Tag>
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                )}

                                {projectData?.[0].plan_renewal_on && (
                                    <Flex justify="center">
                                        <Text
                                            className="font-normal text-xs"
                                            style={{
                                                color: '#000',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {data?.activeSubscriptions?.status === 'EXPIRED'
                                                ? `Expired on ${formattedDateOnly(new Date(data?.activeSubscriptions?.subscriptionEndDate))}`
                                                : `Expires on ${projectData[0].plan_renewal_on ? formattedDateOnly(new Date(projectData[0].plan_renewal_on)) : 'N/A'}`}
                                        </Text>
                                    </Flex>
                                )}

                                <Flex justify="center">
                                    {projectData && projectData[0].is_whatsapp_verified ? (
                                        <Text
                                            className="font-normal text-lg"
                                            style={{
                                                color: '#007B3F',
                                                textAlign: 'center',
                                            }}
                                        >
                                            WABA Verified
                                        </Text>
                                    ) : (
                                        <Flex gap={10} vertical justify="center" align="center">
                                            <Text className="text-sm">
                                                Verify your WhatsApp Business
                                            </Text>
                                            <Button
                                                danger
                                                size="small"
                                                className="w-full overflow-hidden mt-2 whitespace-nowrap"
                                                onClick={() =>
                                                    handleApplyNowClick(
                                                        projectData ? projectData[0].id : ''
                                                    )
                                                }
                                                loading={embeddedLoading}
                                            >
                                                Verify Now
                                                {/* Verify your WhatsApp for Business Account */}
                                            </Button>
                                        </Flex>
                                    )}
                                </Flex>
                            </Flex>
                        </Col>
                        <Col
                            xs={24}
                            sm={12}
                            lg={12}
                            xl={6}
                            className={`${isExpired ? 'pointer-events-none' : ''}`}
                        >
                            <Flex
                                vertical
                                className="mt-8 justify-between p-5 px-6 xxl:px-10 rounded-2xl"
                                gap={5}
                                justify="center"
                                style={{
                                    background: '#F9F9F9',
                                    height: '250px',
                                    overflow: 'hidden',
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#666',
                                        textAlign: 'center',
                                        lineHeight: '1.4',
                                    }}
                                >
                                    Conversation Credits
                                </Text>

                                <Text
                                    className="font-normal"
                                    style={{
                                        color: '#000',
                                        fontSize: '18px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Balance:&nbsp;
                                    {projectData?.[0].credit
                                        ? `${Number(projectData[0].credit).toFixed(2)} USD`
                                        : '0'}
                                </Text>

                                <Formik
                                    initialValues={{ amount: '' }}
                                    validationSchema={validationSchema}
                                    onSubmit={handleSubmit}
                                >
                                    {({ values, handleChange, setFieldValue }) => (
                                        <Form>
                                            <Flex gap={3} align="start" justify="start">
                                                <Text className="text-iconRed text-xs md:text-[0.8rem]">
                                                    *
                                                </Text>
                                                <Text className="text-xs md:text-[0.8rem]">
                                                    Amount
                                                </Text>
                                            </Flex>
                                            <TextInput
                                                name="amount"
                                                type="string"
                                                placeholder="Please enter amount"
                                                isRequired
                                                maxLength={15}
                                                allowTwoDecimalsOnly
                                                classes="rounded-sm text-sm"
                                                isDisabled={ENV !== 'production'}
                                                handleChange={value =>
                                                    handleAmountChange(value, setFieldValue)
                                                }
                                                values={amount}
                                            />
                                            {/* {values.amount ? (
                                                <Alert
                                                    message={
                                                        <Flex className='text-xs'>
                                                            <strong>Note:</strong> {values.amount} ₹ is approximately {convertedAmount}{' '}
                                                            USD.
                                                        </Flex>
                                                    }
                                                    type="success"
                                                />
                                            ) : (
                                                <Alert
                                                    message={
                                                        <>
                                                            <strong>Note:</strong> 1 ₹ = {USD_TO_INR || 3.67} USD.
                                                        </>
                                                    }
                                                    type="success"
                                                />
                                            )} */}
                                            <Flex vertical gap={9} className="-mt-4">
                                                <Flex
                                                    gap={5}
                                                    justify="start"
                                                    className="overflow-auto hide-scroll"
                                                >
                                                    <Button
                                                        size="small"
                                                        className="text-xs rounded"
                                                        disabled={ENV !== 'production'}
                                                        style={{
                                                            color: `${amount === '100' ? 'red' : '#C7C7C7'}`,
                                                            borderColor: `${amount === '100' ? 'red' : '#C7C7C7'}`,
                                                        }}
                                                        onClick={() =>
                                                            handleAmountChange('100', setFieldValue)
                                                        }
                                                    >
                                                        ₹ 100
                                                    </Button>

                                                    <Button
                                                        size="small"
                                                        className="text-xs rounded"
                                                        disabled={ENV !== 'production'}
                                                        style={{
                                                            color: `${amount === '500' ? 'red' : '#C7C7C7'}`,
                                                            borderColor: `${amount === '500' ? 'red' : '#C7C7C7'}`,
                                                        }}
                                                        onClick={() =>
                                                            handleAmountChange('500', setFieldValue)
                                                        }
                                                    >
                                                        ₹ 500
                                                    </Button>

                                                    <Button
                                                        size="small"
                                                        className="text-xs rounded"
                                                        disabled={ENV !== 'production'}
                                                        style={{
                                                            color: `${amount === '1000' ? 'red' : '#C7C7C7'}`,
                                                            borderColor: `${amount === '1000' ? 'red' : '#C7C7C7'}`,
                                                        }}
                                                        onClick={() =>
                                                            handleAmountChange(
                                                                '1000',
                                                                setFieldValue
                                                            )
                                                        }
                                                    >
                                                        ₹ 1000
                                                    </Button>
                                                </Flex>
                                                <Button
                                                    type="primary"
                                                    danger
                                                    loading={loading}
                                                    size="small"
                                                    htmlType="submit"
                                                    className="text-xs"
                                                    disabled={ENV !== 'production'}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: '#FF4D4F',
                                                        color: '#FFF',
                                                        borderRadius: '4px',
                                                        opacity: isExpired ? '0.5' : '1',
                                                    }}
                                                >
                                                    Top-Up Now
                                                </Button>
                                            </Flex>
                                        </Form>
                                    )}
                                </Formik>
                            </Flex>
                        </Col>
                        <Col
                            xs={24}
                            sm={12}
                            lg={12}
                            xl={6}
                            onClick={handleClick}
                            className={`${isExpired ? 'pointer-events-none' : ''}`}
                        >
                            <Features
                                icon={dashboardIcon}
                                bgColor={isExpired ? '#FFF8F6' : '#FFF6F2'}
                                title=""
                                description="Go to WhatsApp for Business Dashboard"
                                iconStyle={{ opacity: isExpired ? '0.5' : '1' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={12} xl={6} onClick={handleSubscriptionClick}>
                            <Features
                                icon={subscriptionIcon}
                                bgColor="#FFF6F2"
                                title=""
                                description="Manage Subscription"
                                iconStyle={{ opacity: '1' }}
                            />
                        </Col>
                    </Row>
                </RenewalOverlay>
            )}
            <DashFooter />
            <Flex className="w-full mt-8">
                <ConversationCharges />
            </Flex>
        </Flex>
    );
};

export default LandingPage;
