import { Button, Col, Descriptions, Flex, Form, Popconfirm, Row, Typography } from 'antd';
import { ErrorMessage, Formik } from 'formik';
import { Link } from 'react-router-dom';

import TextInput from '@components/atomic/inputs/TextInput';
import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { snakeCaseToSentenceCase } from '@utils/wordFormat';

import AirlineFileUploadInput from './AirlineFileUploadInput';
import useModification from '../../hooks/airline/useModification';
import { airlineTicketUpdateSchema } from '../../schema/airline';

const UploadNewTicket = ({
    data,
    bookingId,
    getAllTableData,
}: {
    data: any;
    bookingId: string | number;
    getAllTableData: () => void;
}) => {
    const { sm } = useScreenSize();
    const { isLoadingNewTicket, uploadNewTicket, isCancelling, rejectModificationPayment } =
        useModification(getAllTableData);
    const {
        modificationStatus,
        refundedAmount,
        additionalPayment,
        transaction: { transactionDate, corporateTxnId },
        flightTicketDoc,
        flightTicketPNR,
    } = data || {};

    return (
        <Formik
            initialValues={{
                flightTicketDoc: flightTicketDoc || '',
                flightTicketPNR: flightTicketPNR || '',
            }}
            validationSchema={airlineTicketUpdateSchema}
            onSubmit={values => uploadNewTicket({ bookingId, ...values })}
        >
            {({ handleSubmit, setFieldValue }) => (
                <Form
                    onFinish={handleSubmit}
                    layout="vertical"
                    className="w-full "
                    style={{ padding: '20px' }}
                >
                    <Flex vertical>
                        <Descriptions
                            title="Payment"
                            layout={sm ? 'horizontal' : 'vertical'}
                            column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
                        >
                            <Descriptions.Item label="Amount Paid">
                                ₹ {formatNumberWithLocalString(additionalPayment)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment Date and Time">
                                {formattedDateTime(new Date(transactionDate))}
                            </Descriptions.Item>
                            <Descriptions.Item label="Corporate Transaction ID">
                                {corporateTxnId}
                            </Descriptions.Item>
                            <Descriptions.Item label="Modification Status">
                                {snakeCaseToSentenceCase(modificationStatus)}
                            </Descriptions.Item>
                            {modificationStatus === 'MODIFICATION_REJECTED' && (
                                <Descriptions.Item label="Amount Refunded">
                                    ₹ {formatNumberWithLocalString(refundedAmount)}
                                </Descriptions.Item>
                            )}
                            {flightTicketDoc && (
                                <Descriptions.Item label="New Ticket">
                                    <Link to={flightTicketDoc} target="_blank">
                                        <Typography.Paragraph
                                            // copyable
                                            className="text-green-600 custom-copyable hover:underline cursor-pointer"
                                        >
                                            View & Download
                                        </Typography.Paragraph>
                                    </Link>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Flex>
                    {!flightTicketDoc &&
                        modificationStatus === 'MODIFICATION_PAYMENT_COMPLETED' && (
                            <>
                                <Row gutter={[20, 5]}>
                                    <Col span={24} sm={12} md={8} lg={6}>
                                        <TextInput
                                            label="Ticket PNR"
                                            name="flightTicketPNR"
                                            placeholder="Please enter airline PNR"
                                            type="text"
                                            maxLength={20}
                                            allowUpperCaseOnly
                                            isRequired
                                        />
                                    </Col>
                                    <Col span={24} sm={12} md={8} lg={6}>
                                        <AirlineFileUploadInput
                                            allowedFileTypes={['application/pdf']}
                                            existingFileUrl={flightTicketDoc || ''}
                                            label="New Flight Ticket"
                                            name="flightTicketDoc.base64"
                                            format="flightTicketDoc.format"
                                            showFileName
                                            classes="w-full"
                                            existingFilName="Flight Ticket.pdf"
                                            isrequired
                                        />
                                        <ErrorMessage
                                            name="flightTicketDoc"
                                            render={msg => (
                                                <div
                                                    className="-mt-5 error-message"
                                                    style={{ color: '#FF3A3A' }}
                                                >
                                                    {msg}
                                                </div>
                                            )}
                                        />
                                    </Col>
                                </Row>
                                <Flex gap={10} justify="" className="mt-3">
                                    <Button
                                        type="primary"
                                        danger
                                        htmlType="submit"
                                        loading={isLoadingNewTicket}
                                        disabled={modificationStatus === 'TICKETED' || isCancelling}
                                    >
                                        Upload New Ticket
                                    </Button>
                                    <Popconfirm
                                        title="Confirm Rejection and Refund"
                                        description="Are you sure you want to reject this modification and refund the amount paid by the user?"
                                        onConfirm={() => rejectModificationPayment({ bookingId })}
                                        okText="Yes"
                                        cancelText="No"
                                        okButtonProps={{ type: 'primary', danger: true }}
                                        cancelButtonProps={{ type: 'default' }}
                                    >
                                        <Button
                                            type="default"
                                            danger
                                            loading={isCancelling}
                                            disabled={isLoadingNewTicket}
                                        >
                                            Reject & Refund
                                        </Button>
                                    </Popconfirm>
                                </Flex>
                            </>
                        )}
                </Form>
            )}
        </Formik>
    );
};

export default UploadNewTicket;
