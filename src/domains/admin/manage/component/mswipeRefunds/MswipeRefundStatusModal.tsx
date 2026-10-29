import { Col, Flex, Form, Row, Typography } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import FieldLabelValue from '@components/molecular/Text/FieldLabelValue';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { mswipeRefundStatusSchema } from '../../schema/mswipeRefundStatusSchema';
import {
    MswipeRefund,
    MswipeRefundStatusOption,
    UpdateMswipeRefundPayload,
} from '../../types/mswipeRefunds';

type Props = {
    refund: MswipeRefund;
    statuses: MswipeRefundStatusOption[];
    canUpdate: boolean;
    isUpdating: boolean;
    handleCancel: () => void;
    handleSubmit: (payload: UpdateMswipeRefundPayload) => Promise<boolean>;
};

const toAmount = (value: number | null) =>
    value === null ? null : `₹ ${formatNumberWithLocalString(value)}`;

const MswipeRefundStatusModal = ({
    refund,
    statuses,
    canUpdate,
    isUpdating,
    handleCancel,
    handleSubmit,
}: Props) => {
    const statusName = (status: string) =>
        statuses.find(option => option.status === status)?.name ?? status;
    const details = [
        { label: 'Transaction ID', value: refund.corporateTxnId },
        { label: 'Status', value: refund.statusName },
        { label: 'Customer', value: refund.customerName },
        { label: 'Customer Email', value: refund.customerEmail },
        { label: 'Partner', value: refund.partnerName || 'Default' },
        { label: 'Service', value: refund.serviceName },
        { label: 'Refund Amount', value: toAmount(refund.refundAmount) },
        { label: 'Amount Paid', value: toAmount(refund.paidAmount) },
        { label: 'Paid On', value: refund.paymentDetails?.paymentTime },
        { label: 'Mswipe IPG ID', value: refund.gatewayOrderId },
        { label: 'RRN', value: refund.gatewayReference },
        { label: 'MID', value: refund.paymentDetails?.mid },
        { label: 'TID', value: refund.paymentDetails?.tid },
        { label: 'Reason', value: refund.reason },
        { label: 'Mswipe Refund Reference', value: refund.refundReference },
        { label: 'Remarks', value: refund.remarks },
    ];

    return (
        <CustomModalWithForm
            open
            modalTitle={canUpdate ? 'Update Refund Status' : 'Refund Details'}
            handleCancel={handleCancel}
            initialValues={{ status: '', refundReference: '', remarks: '' }}
            validationSchema={mswipeRefundStatusSchema}
            isLoading={isUpdating}
            hideFooter={!canUpdate}
            width={720}
            handleFormSubmit={async values => {
                const updated = await handleSubmit({
                    id: refund.id,
                    status: values.status,
                    refundReference:
                        values.status === 'SUCCESS' ? values.refundReference : undefined,
                    remarks: values.remarks || undefined,
                });
                if (updated) handleCancel();
            }}
        >
            {({ values }) => (
                <Flex vertical gap={16} className="w-full">
                    <Row gutter={[16, 0]}>
                        {details.map(({ label, value }) => (
                            <Col xs={24} sm={12} key={label}>
                                <FieldLabelValue label={label} value={value} />
                            </Col>
                        ))}
                    </Row>
                    {refund.history.length > 0 && (
                        <Flex vertical gap={8}>
                            <Typography.Text className="font-medium">History</Typography.Text>
                            {refund.history.map(entry => (
                                <Flex key={`${entry.status}-${entry.at}`} gap={8} wrap>
                                    <Typography.Text type="secondary">
                                        {formattedDateTime(new Date(entry.at))}
                                    </Typography.Text>
                                    <Typography.Text>
                                        {statusName(entry.status)}
                                        {entry.remarks ? ` (${entry.remarks})` : ''}
                                    </Typography.Text>
                                </Flex>
                            ))}
                        </Flex>
                    )}
                    {canUpdate && (
                        <Form layout="vertical">
                            <SelectInput
                                name="status"
                                isRequired
                                label="Update Status"
                                placeholder="Please select a status"
                                options={refund.nextStatuses.map(({ status, name }) => ({
                                    value: status,
                                    label: name,
                                }))}
                            />
                            {values.status === 'SUCCESS' && (
                                <TextInput
                                    name="refundReference"
                                    type="text"
                                    isRequired
                                    label="Mswipe Refund Reference"
                                    placeholder="Enter the refund reference from Mswipe"
                                    maxLength={128}
                                />
                            )}
                            <TextAreaInput
                                name="remarks"
                                isRequired={values.status === 'FAILED'}
                                label={
                                    values.status === 'FAILED' ? 'Reason for Rejection' : 'Remarks'
                                }
                                placeholder="Enter remarks"
                                maxLength={500}
                                showCount
                            />
                        </Form>
                    )}
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default MswipeRefundStatusModal;
