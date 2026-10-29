import { useEffect } from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

const { Title, Text } = Typography;

const VisaPaymentSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const reduxOrderNumber = useAppSelector(state => state.reducer.visa.orderNumber);
    const orderNumber = (location.state as any)?.orderNumber ?? reduxOrderNumber ?? '';

    useEffect(() => {
        // Visa has its own dedicated success page (see the accessKeys.visa branch in
        // payments/hooks/usePaymentApi.ts, which routes here instead of the generic
        // payments success page) — so visa_payment_result has to be fired here, reading the
        // same paymentResult sessionStorage payload the generic checkout mechanism seeded.
        const paymentResultRaw = sessionStorage.getItem('paymentResult');
        if (paymentResultRaw && typeof Moengage?.track_event === 'function') {
            try {
                const paymentResult = JSON.parse(paymentResultRaw);
                Moengage.track_event('visa_payment_result', {
                    status: 'success',
                    total_amount: paymentResult.total_amount,
                });
            } catch (_) { /* ignore parse errors */ }
        }
        sessionStorage.removeItem('paymentResult');
    }, []);

    return (
        <Flex
            justify="center"
            align="center"
            style={{ minHeight: '80vh', padding: '24px' }}
        >
            <Card
                bordered={false}
                className="p-4 sm:p-9"
                style={{
                    width: '100%',
                    maxWidth: 818,
                    borderRadius: 28,
                    boxShadow: '0px 1.5px 16.5px rgba(0, 0, 0, 0.06)',
                }}
                styles={{ body: { padding: 0 } }}
            >
                <Flex vertical align="center" gap={12}>
                    {/* Layered green checkmark */}
                    <Flex
                        align="center"
                        justify="center"
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: '#E8FAF0',
                        }}
                    >
                        <Flex
                            align="center"
                            justify="center"
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                backgroundColor: '#D1F4E0',
                            }}
                        >
                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    backgroundColor: '#45D483',
                                }}
                            >
                                <CheckOutlined
                                    style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}
                                />
                            </Flex>
                        </Flex>
                    </Flex>

                    {/* Title */}
                    <Title
                        level={2}
                        style={{
                            margin: 0,
                            fontWeight: 600,
                            fontSize: 28,
                            color: '#1E293B',
                            textAlign: 'center',
                        }}
                    >
                        Booking Confirmed!
                    </Title>

                    {/* Subtitle */}
                    <Text
                        style={{
                            fontSize: 18,
                            color: '#6A7282',
                            textAlign: 'center',
                            maxWidth: 538,
                            lineHeight: '32px',
                        }}
                    >
                        Your visa application has been submitted successfully. We will keep you updated on the status.
                    </Text>

                    {/* Order number card */}
                    <Card
                        bordered
                        style={{
                            backgroundColor: '#F9F9F9',
                            border: '1px solid #E7E5E5',
                            borderRadius: 24,
                            marginTop: 16,
                        }}
                        styles={{ body: { padding: '10px 26px 19px' } }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                textAlign: 'center',
                                display: 'block',
                                lineHeight: '36px',
                                color: '#000000',
                            }}
                        >
                            ORDER NUMBER
                            <br />
                            <strong>{orderNumber}</strong>
                        </Text>
                    </Card>

                    {/* Action buttons */}
                    <Flex gap={9} wrap="wrap" justify="center" style={{ marginTop: 16 }}>
                        <Button
                            type="primary"
                            style={{
                                backgroundColor: '#FF4F4F',
                                borderColor: '#FF4F4F',
                                borderRadius: 8,
                                height: 48,
                                flex: '1 1 150px',
                                minWidth: 140,
                                fontWeight: 500,
                                fontSize: 16,
                            }}
                            onClick={() =>
                                navigate(
                                    `${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.visaTracking}/${orderNumber}`
                                )
                            }
                        >
                            Track Application
                        </Button>
                        <Button
                            style={{
                                borderColor: '#FF4F4F',
                                color: '#FF4F4F',
                                borderRadius: 8,
                                height: 48,
                                flex: '1 1 150px',
                                minWidth: 140,
                                fontWeight: 500,
                                fontSize: 16,
                            }}
                            onClick={() => navigate(paths.dashboard.home)}
                        >
                            Go to Dashboard
                        </Button>
                    </Flex>
                </Flex>
            </Card>
        </Flex>
    );
};

export default VisaPaymentSuccess;
