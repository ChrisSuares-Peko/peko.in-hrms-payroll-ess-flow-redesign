import { useState } from 'react';

import { Button, Card, Col, Divider, Flex, Form, Row, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import OtpModal from '@components/molecular/modals/OtpModal';
import { Scope } from '@src/enums/enums';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { getotp } from '../api';
import CancellationPolicy from '../components/cancelDetails/CancellationPolicy';
import HeadDetails from '../components/cancelDetails/HeadDetails';
import useCancelTicket from '../hooks/useCancelBooking';
import { cancellationSchema } from '../schema/ReceiverDetailsSchema';

const CancelDetails = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { bookingId } = location.state || {};

    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { HandleCancelTicket, isLoading, cancellationCharges, cancelLoading, chargesError } =
        useCancelTicket(bookingId);
    const orderDetails = useAppSelector(state => state.reducer.airline.orderDetails);
    const [isOpen, setIsOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [formValues, setFormValues] = useState<any>();

    const handleCancellation = async (otp: string) => {
        const res = await HandleCancelTicket({
            flightBookingId: bookingId,
            reasonForCancellation: formValues.reasonForCancellation,
            otp,
            scope: Scope.EMAIL,
        });
        if (res.status === false) {
            dispatch(showToast({ description: 'Ticket Cancellation Failed', variant: 'error' }));
        } else if (res.status === true) {
            dispatch(
                showToast({ description: 'Ticket Cancelled Successfully', variant: 'success' })
            );
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}/${paths.airline.bookingDetails}/${paths.airline.cancelSuccess}`
            );
        }
    };

    const handleGetOtp = async (values: any) => {
        if (chargesError) {
            dispatch(
                showToast({
                    description:
                        'Unable to fetch cancellation charges. Please try again later.',
                    variant: 'error',
                })
            );
            return;
        }
        setIsOtpSending(true);
        setFormValues(values);
        const resp = await getotp({
            userId: id,
            userType: role,
            scope: Scope.EMAIL,
            id: orderDetails.id,
        });
        if (resp) {
            setIsOtpSending(false);
            setIsOpen(true);
        } else {
            setIsOtpSending(false);
            // Handle error if OTP request fails
        }
    };
    const amountPaid =
        (cancellationCharges?.CancellationCharge ?? 0) +
        (cancellationCharges?.RefundAmount ?? 0);

    return (
        <>
            <Row>
                <Col span={24}>
                    <Flex vertical gap={24}>
                        <HeadDetails title="Cancel Booking" />
                        {isLoading ? (
                            <Skeleton />
                        ) : (
                            <Formik
                                initialValues={{ reasonForCancellation: '' }}
                                onSubmit={values => handleGetOtp(values)}
                                validationSchema={cancellationSchema}
                            >
                                {({ handleSubmit }) => (
                                    <Form layout="vertical" onFinish={handleSubmit}>
                                        <Row gutter={[24, 24]}>
                                            {/* Left column — policy + reason */}
                                            <Col xs={24} md={14}>
                                                <Flex vertical gap={24}>
                                                    <CancellationPolicy cancellationCharges={cancellationCharges} />
                                                    <TextAreaInput
                                                        name="reasonForCancellation"
                                                        placeholder="Enter reason for cancellation"
                                                        label="Reason for Cancellation"
                                                        maxLength={10000}
                                                        isRequired
                                                        showCount
                                                    />
                                                </Flex>
                                            </Col>

                                            {/* Right column — refund summary + actions */}
                                            <Col xs={24} md={10}>
                                                <Card
                                                    variant="outlined"
                                                    style={{ borderRadius: 8, borderColor: '#f0f0f0' }}
                                                    styles={{ body: { padding: 0 } }}
                                                >
                                                    <div style={{ background: '#F8FAFC', padding: '12px 20px', borderRadius: '8px 8px 0 0' }}>
                                                        <Typography.Title level={5} style={{ margin: 0 }}>
                                                            Refund Summary
                                                        </Typography.Title>
                                                    </div>
                                                    <Divider style={{ margin: 0 }} />
                                                    <Flex vertical gap={12} style={{ padding: '20px 24px' }}>
                                                        {!!amountPaid && (
                                                            <Flex justify="space-between">
                                                                <Typography.Text>
                                                                    Amount Paid
                                                                </Typography.Text>
                                                                <Typography.Text className="font-medium">
                                                                    ₹ {formatNumberWithLocalString(amountPaid)}
                                                                </Typography.Text>
                                                            </Flex>
                                                        )}
                                                        {cancellationCharges?.CancellationCharge && (
                                                            <Flex justify="space-between">
                                                                <Typography.Text>
                                                                    Cancellation Charge
                                                                </Typography.Text>
                                                                <Typography.Text className="font-medium" style={{ color: '#EC003F' }}>
                                                                    - ₹ {formatNumberWithLocalString(cancellationCharges.CancellationCharge)}
                                                                </Typography.Text>
                                                            </Flex>
                                                        )}
                                                        {cancellationCharges?.RefundAmount && (
                                                            <>
                                                                <Divider style={{ margin: '4px 0' }} />
                                                                <Flex justify="space-between">
                                                                    <Typography.Text strong>
                                                                        Refund Amount
                                                                    </Typography.Text>
                                                                    <Typography.Text strong style={{ color: '#009966' }}>
                                                                        ₹ {formatNumberWithLocalString(cancellationCharges.RefundAmount)}
                                                                    </Typography.Text>
                                                                </Flex>
                                                                <Typography.Text className="text-xs">
                                                                    Credited to original payment method in 7–10 business days.
                                                                </Typography.Text>
                                                            </>
                                                        )}
                                                    </Flex>
                                                    <Divider style={{ margin: '16px 0' }} />
                                                    <Flex gap={8} justify="center" style={{ paddingBottom: 8 }}>
                                                        <Button
                                                            type="default"
                                                            style={{ borderColor: '#FF4D4F', color: '#FF4D4F' }}
                                                            onClick={() =>
                                                                navigate(
                                                                    `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}/${paths.airline.bookingDetails}`
                                                                )
                                                            }
                                                        >
                                                            Go Back
                                                        </Button>
                                                        <Button
                                                            htmlType="submit"
                                                            type="primary"
                                                            danger
                                                            loading={isOtpSending}
                                                            disabled={chargesError}
                                                            style={chargesError ? {} : { backgroundColor: '#FF4D4F', borderColor: '#FF4D4F' }}
                                                        >
                                                            Confirm Cancellation
                                                        </Button>
                                                    </Flex>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Form>
                                )}
                            </Formik>
                        )}
                    </Flex>
                </Col>
            </Row>
            <OtpModal
                isOpen={isOpen}
                isLoading={cancelLoading!}
                handleCancel={() => setIsOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    await getotp({
                        userId: id,
                        userType: role,
                        scope: Scope.EMAIL,
                        id: orderDetails.id,
                    });
                    setIsOtpSending(false);
                }}
                handleSubmit={handleCancellation}
                title="Confirmation"
                description="OTP has been sent to your email address provided during booking."
            />
        </>
    );
};

export default CancelDetails;
