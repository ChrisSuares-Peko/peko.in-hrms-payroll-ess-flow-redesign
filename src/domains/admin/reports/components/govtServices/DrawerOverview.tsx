import { Descriptions, Tag, Typography } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PAYMENT_STATUS_COLOR, STATUS_COLOR } from './constants';
import { GSV2AdminApplication } from '../../api/governmentServicesApplicationV2';

const { Text } = Typography;

const dateTime = (value?: string | null) =>
    value ? `${formattedDateOnly(new Date(value))} ${formattedTime(new Date(value))}` : '-';

export const OverviewSection = ({ application }: { application: GSV2AdminApplication }) => (
    <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="IndiaFilings Application ID" span={2}>
            <Text code>{application.applicationId || '-'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
            <Tag color={STATUS_COLOR[application.status]}>{application.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Payment Status">
            <Tag color={PAYMENT_STATUS_COLOR[application.paymentStatus ?? 'PENDING']}>
                {application.paymentStatus ?? 'PENDING'}
            </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Amount">
            <Text strong>₹ {formatNumberWithLocalString(Number(application.amount) || 0)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Transaction ID">{application.corporateTxnId || '-'}</Descriptions.Item>
        <Descriptions.Item label="Paid At">{dateTime(application.paidAt)}</Descriptions.Item>
        <Descriptions.Item label="Vendor Gid">{application.vendorGid || '-'}</Descriptions.Item>
        <Descriptions.Item label="Vendor Engagement">{application.vendorEngagementId || '-'}</Descriptions.Item>
        <Descriptions.Item label="Created On">{dateTime(application.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Submitted On">{dateTime(application.submittedAt)}</Descriptions.Item>
        <Descriptions.Item label="Completed On">{dateTime(application.completedAt)}</Descriptions.Item>
        {application.rejectionReason && (
            <Descriptions.Item label="Rejection Reason" span={2}>
                <Text type="danger">{application.rejectionReason}</Text>
            </Descriptions.Item>
        )}
    </Descriptions>
);

export const BusinessSection = ({ application }: { application: GSV2AdminApplication }) => (
    <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Service">
            {application.serviceName || '-'}
            {application.variantName ? ` — ${application.variantName}` : ''}
        </Descriptions.Item>
        <Descriptions.Item label="Legal Business Name">{application.legalBusinessName || '-'}</Descriptions.Item>
        <Descriptions.Item label="PAN">{application.pan || '-'}</Descriptions.Item>
        <Descriptions.Item label="Phone Number">{application.phoneNumber || '-'}</Descriptions.Item>
        <Descriptions.Item label="State of Registration">{application.stateOfRegistration || '-'}</Descriptions.Item>
        <Descriptions.Item label="Corporate">
            {application.credential?.name || '-'}
            {application.credential?.username ? ` (${application.credential.username})` : ''}
        </Descriptions.Item>
    </Descriptions>
);

// Trademark's own filing form (applicationData.trademarkForm) — the only Gov Services V2 service live today, so rendered by field.
export const FilingSection = ({ application }: { application: GSV2AdminApplication }) => {
    const form = (application.applicationData?.trademarkForm ?? null) as Record<string, unknown> | null;
    if (!form) {
        return <Text type="secondary">No filing details saved yet.</Text>;
    }
    const str = (key: string) => (form[key] ? String(form[key]) : '-');
    const description = Array.isArray(form.description) ? (form.description as string[]).join(', ') : '-';

    return (
        <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Entity Type">{str('entityType')}</Descriptions.Item>
            <Descriptions.Item label="Salutation">{str('salutation')}</Descriptions.Item>
            <Descriptions.Item label="Authorized Person">{str('authorizedPerson')}</Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>{str('address')}</Descriptions.Item>
            <Descriptions.Item label="PIN code">{str('pincode')}</Descriptions.Item>
            <Descriptions.Item label="State">{str('state')}</Descriptions.Item>
            <Descriptions.Item label="District">{str('district')}</Descriptions.Item>
            <Descriptions.Item label="Country">{str('country')}</Descriptions.Item>
            <Descriptions.Item label="Brand to be Trademarked">{str('brand')}</Descriptions.Item>
            <Descriptions.Item label="Language">{str('language')}</Descriptions.Item>
            <Descriptions.Item label="Main Goods or Service">{str('mainGoodsOrService')}</Descriptions.Item>
            <Descriptions.Item label="Class">{str('trademarkClass')}</Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>{description}</Descriptions.Item>
            <Descriptions.Item label="Trademark in Use">{form.trademarkInUse ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Associated Marks">{str('associatedMarks')}</Descriptions.Item>
            <Descriptions.Item label="Logo" span={2}>{str('logoFileName')}</Descriptions.Item>
        </Descriptions>
    );
};
