import { Descriptions, Tag, Typography } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import {
    ENTITY_TYPE_LABEL,
    PAYMENT_STATUS_COLOR,
    STATUS_COLOR,
    VENDOR_STATUS_COLOR,
} from './constants';
import { BRAdminApplication } from '../../api/businessRegistration';

const { Text } = Typography;

const dateTime = (value?: string) =>
    value ? `${formattedDateOnly(new Date(value))} ${formattedTime(new Date(value))}` : '-';

export const OverviewSection = ({ application }: { application: BRAdminApplication }) => (
    <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Application ID" span={2}>
            <Text code>{application.applicationId}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
            <Tag color={STATUS_COLOR[application.status]}>{application.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Entity Type">
            {ENTITY_TYPE_LABEL[application.entityType] ?? application.entityType}
        </Descriptions.Item>
        <Descriptions.Item label="Payment Status">
            <Tag color={PAYMENT_STATUS_COLOR[application.paymentStatus ?? 'PENDING']}>
                {application.paymentStatus ?? 'PENDING'}
            </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Transaction ID">
            {application.corporateTxnId || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Incorporation Fee">
            ₹ {formatNumberWithLocalString(application.incorporationFee ?? 0)}
        </Descriptions.Item>
        <Descriptions.Item label="GST / Other Fees">
            ₹ {formatNumberWithLocalString(application.gstAmount ?? 0)}
        </Descriptions.Item>
        <Descriptions.Item label="Total Amount">
            <Text strong>₹ {formatNumberWithLocalString(application.totalAmount ?? 0)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Paid At">{dateTime(application.paidAt)}</Descriptions.Item>
        <Descriptions.Item label="Vendor Status">
            <Tag color={VENDOR_STATUS_COLOR[application.vendorStatus ?? 'NOT_SENT']}>
                {application.vendorStatus ?? 'NOT_SENT'}
            </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="IndiaFilings Application ID">
            {application.vendorApplicationId || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Vendor Engagement">
            {application.vendorEngagementId || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="SRN">{application.srn || '-'}</Descriptions.Item>
        <Descriptions.Item label="Created On">{dateTime(application.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Submitted On">
            {dateTime(application.submittedAt ?? undefined)}
        </Descriptions.Item>
        {application.vendorError && (
            <Descriptions.Item label="Vendor Error" span={2}>
                <Text type="danger">{application.vendorError}</Text>
            </Descriptions.Item>
        )}
        {application.rejectionReason && (
            <Descriptions.Item label="Rejection Reason" span={2}>
                <Text type="danger">{application.rejectionReason}</Text>
            </Descriptions.Item>
        )}
    </Descriptions>
);

export const BusinessSection = ({ application }: { application: BRAdminApplication }) => {
    const data = application.applicationData ?? {};
    const proposedNames = (data.proposedNames ?? {}) as Record<string, string>;
    return (
        <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Business Name">
                {application.businessName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="State of Incorporation">
                {(data.stateOfIncorporation as string) || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Person">
                {application.contactPerson || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Email">
                {application.contactEmail || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Mobile">
                {application.contactMobile || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Registered Office">
                {(data.registeredOffice as string) || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Proposed Names" span={2}>
                {[proposedNames.first, proposedNames.second, proposedNames.third, proposedNames.fourth]
                    .filter(Boolean)
                    .join(', ') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Business Description" span={2}>
                {(data.businessDescription as string) || '-'}
            </Descriptions.Item>
        </Descriptions>
    );
};
