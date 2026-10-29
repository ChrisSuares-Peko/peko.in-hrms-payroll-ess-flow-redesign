import { CheckCircleOutlined, ClockCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Collapse, Descriptions, Flex, Spin, Table, Tag, Timeline, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import DrawerModal from '@components/atomic/DrawerModal';
import { DirectorInfo, Shareholder, VendorStage } from '@domains/dashboard/CompanyIncorporation/types';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { AdminApplication, AdminDocument } from '../../api/companyIncorporation';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'orange',
    SUBMITTED: 'blue',
    UNDER_REVIEW: 'purple',
    APPROVED: 'green',
    REJECTED: 'red',
};

const VENDOR_STATUS_COLOR: Record<string, string> = {
    NOT_SENT: 'default',
    SENDING: 'blue',
    SENT: 'green',
    FAILED: 'red',
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
    PENDING: 'orange',
    COMPLETED: 'green',
    FAILED: 'red',
};

const ENTITY_TYPE_LABEL: Record<string, string> = {
    private_limited: 'Private Limited',
    public_limited: 'Public Limited',
    opc: 'OPC',
    llp: 'LLP',
};

const STAGE_ICON: Record<string, React.ReactNode> = {
    completed: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    in_progress: <ClockCircleOutlined style={{ color: '#1677ff' }} />,
    upcoming: <MinusCircleOutlined style={{ color: '#d9d9d9' }} />,
};

const STAGE_COLOR: Record<string, string> = {
    completed: 'green',
    in_progress: 'blue',
    upcoming: 'default',
};

type Props = {
    open: boolean;
    application: AdminApplication | null;
    loading: boolean;
    onClose: () => void;
};

const directorColumns: ColumnsType<DirectorInfo> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Nationality', dataIndex: 'nationality', key: 'nationality' },
    { title: 'PAN', dataIndex: 'panNumber', key: 'panNumber' },
    { title: 'DIN', dataIndex: 'din', key: 'din', render: v => v || '-' },
    {
        title: 'Has DIN',
        dataIndex: 'hasDIN',
        key: 'hasDIN',
        render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
        title: 'Has DSC',
        dataIndex: 'hasDSC',
        key: 'hasDSC',
        render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Mobile', dataIndex: 'mobile', key: 'mobile' },
];

const shareholderColumns: ColumnsType<Shareholder> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'PAN', dataIndex: 'panNumber', key: 'panNumber', render: v => v || '-' },
    { title: 'Nationality', dataIndex: 'nationality', key: 'nationality', render: v => v || '-' },
    {
        title: 'Shares Allotted',
        dataIndex: 'sharesAllotted',
        key: 'sharesAllotted',
        render: v => formatNumberWithLocalString(v) || '-',
    },
    {
        title: 'Shareholding %',
        dataIndex: 'shareholding',
        key: 'shareholding',
        render: v => (v !== undefined ? `${v}%` : '-'),
    },
];

const ApplicationDetailDrawer = ({ open, application, loading, onClose }: Props) => {
    if (!application) return null;

    const isLlp = application.entityType === 'llp';

    const items = [
        {
            key: 'overview',
            label: 'Overview',
            children: (
                <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Application ID" span={2}>
                        <Text code>{application.applicationId}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag color={STATUS_COLOR[application.status]}>{application.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Vendor Status">
                        <Tag color={VENDOR_STATUS_COLOR[application.vendorStatus ?? 'NOT_SENT']}>
                            {application.vendorStatus ?? 'NOT_SENT'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Status">
                        <Tag color={PAYMENT_STATUS_COLOR[application.paymentStatus ?? 'PENDING']}>
                            {application.paymentStatus ?? 'PENDING'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Entity Type">
                        {ENTITY_TYPE_LABEL[application.entityType] ?? application.entityType}
                    </Descriptions.Item>
                    <Descriptions.Item label="Incorporation Fee">
                        ₹ {formatNumberWithLocalString(application.incorporationFee ?? 0)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Additional Services Fee">
                        ₹ {formatNumberWithLocalString(application.additionalServicesFee ?? 0)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Amount">
                        <Text strong>₹ {formatNumberWithLocalString(application.totalAmount ?? 0)}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Submitted On" span={2}>
                        {formattedDateOnly(new Date(application.createdAt))}{' '}
                        {formattedTime(new Date(application.createdAt))}
                    </Descriptions.Item>
                    {application.rejectionReason && (
                        <Descriptions.Item label="Rejection Reason" span={2}>
                            <Text type="danger">{application.rejectionReason}</Text>
                        </Descriptions.Item>
                    )}
                </Descriptions>
            ),
        },
        {
            key: 'basic',
            label: 'Applicant & Basic Details',
            children: (
                <Flex vertical gap={16}>
                    <Descriptions column={2} size="small" bordered title="Applicant">
                        <Descriptions.Item label="Full Name">
                            {application.applicantDetails?.fullName}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            {application.applicantDetails?.email}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mobile">
                            {application.applicantDetails?.mobile}
                        </Descriptions.Item>
                        <Descriptions.Item label="State">
                            {application.applicantDetails?.state}
                        </Descriptions.Item>
                    </Descriptions>
                    <Descriptions column={1} size="small" bordered title="Proposed Names">
                        <Descriptions.Item label="1st Choice">
                            {application.proposedNames?.firstChoice}
                        </Descriptions.Item>
                        {application.proposedNames?.secondChoice && (
                            <Descriptions.Item label="2nd Choice">
                                {application.proposedNames.secondChoice}
                            </Descriptions.Item>
                        )}
                        {application.proposedNames?.thirdChoice && (
                            <Descriptions.Item label="3rd Choice">
                                {application.proposedNames.thirdChoice}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                    <Descriptions column={2} size="small" bordered title="Registered Office">
                        <Descriptions.Item label="Availability">
                            {application.registeredOffice?.availability === 'have'
                                ? 'Has Office'
                                : 'Needs Office'}
                        </Descriptions.Item>
                        {application.registeredOffice?.officeType && (
                            <Descriptions.Item label="Office Type">
                                {application.registeredOffice.officeType}
                            </Descriptions.Item>
                        )}
                        {application.registeredOffice?.address && (
                            <Descriptions.Item label="Address" span={2}>
                                {application.registeredOffice.address}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Has Utility Bill">
                            <Tag color={application.registeredOffice?.hasUtilityBill ? 'green' : 'default'}>
                                {application.registeredOffice?.hasUtilityBill ? 'Yes' : 'No'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Has ID Proof">
                            <Tag color={application.registeredOffice?.hasIdProof ? 'green' : 'default'}>
                                {application.registeredOffice?.hasIdProof ? 'Yes' : 'No'}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Flex>
            ),
        },
        {
            key: 'directors',
            label: `Directors (${application.directors?.length ?? 0})`,
            children: (
                <Table
                    rowKey={r => r.panNumber || r.name}
                    columns={directorColumns}
                    dataSource={application.directors ?? []}
                    pagination={false}
                    size="small"
                    scroll={{ x: 700 }}
                />
            ),
        },
        ...(!isLlp
            ? [
                  {
                      key: 'capital',
                      label: 'Capital & Shareholders',
                      children: (
                          <Flex vertical gap={16}>
                              <Descriptions column={2} size="small" bordered>
                                  <Descriptions.Item label="Authorized Capital">
                                      ₹ {formatNumberWithLocalString(application.capital?.authorizedCapital ?? 0)}
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Paid-Up Capital">
                                      ₹ {formatNumberWithLocalString(application.capital?.paidUpCapital ?? 0)}
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Face Value per Share">
                                      ₹ {formatNumberWithLocalString(application.capital?.faceValuePerShare ?? 10)}
                                  </Descriptions.Item>
                              </Descriptions>
                              {(application.capital?.shareholders?.length ?? 0) > 0 && (
                                  <Table
                                      rowKey={r => r.panNumber || r.name}
                                      columns={shareholderColumns}
                                      dataSource={application.capital?.shareholders ?? []}
                                      pagination={false}
                                      size="small"
                                  />
                              )}
                          </Flex>
                      ),
                  },
              ]
            : []),
        {
            key: 'business',
            label: 'Business Activity',
            children: (
                <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Section">
                        {application.businessActivity?.section || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Division">
                        {application.businessActivity?.division || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Group">
                        {application.businessActivity?.group || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Class">
                        {application.businessActivity?.class || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Sub-class">
                        {application.businessActivity?.subclass || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Secondary Activity">
                        {application.businessActivity?.secondaryActivity || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                        {application.businessActivity?.description || '-'}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        ...(isLlp
            ? [
                  {
                      key: 'llp',
                      label: 'LLP Agreement',
                      children: (
                          <Descriptions column={2} size="small" bordered>
                              <Descriptions.Item label="Agreement Type">
                                  {application.llpAgreement?.agreementType || '-'}
                              </Descriptions.Item>
                              <Descriptions.Item label="Meeting Quorum">
                                  {application.llpAgreement?.meetingQuorum || '-'}
                              </Descriptions.Item>
                              <Descriptions.Item label="Voting Threshold">
                                  {application.llpAgreement?.votingThreshold || '-'}
                              </Descriptions.Item>
                              <Descriptions.Item label="Dispute Resolution Method">
                                  {application.llpAgreement?.disputeResolution?.method || '-'}
                              </Descriptions.Item>
                              <Descriptions.Item label="Jurisdiction">
                                  {application.llpAgreement?.disputeResolution?.jurisdiction || '-'}
                              </Descriptions.Item>
                              {application.llpAgreement?.partnerRights && (
                                  <Descriptions.Item label="Partner Rights" span={2}>
                                      <Flex wrap="wrap" gap={8}>
                                          {Object.entries(application.llpAgreement.partnerRights).map(
                                              ([key, val]) => (
                                                  <Tag key={key} color={val ? 'green' : 'default'}>
                                                      {key}
                                                  </Tag>
                                              )
                                          )}
                                      </Flex>
                                  </Descriptions.Item>
                              )}
                              {application.llpAgreement?.partnerDuties && (
                                  <Descriptions.Item label="Partner Duties" span={2}>
                                      <Flex wrap="wrap" gap={8}>
                                          {Object.entries(application.llpAgreement.partnerDuties).map(
                                              ([key, val]) => (
                                                  <Tag key={key} color={val ? 'green' : 'default'}>
                                                      {key}
                                                  </Tag>
                                              )
                                          )}
                                      </Flex>
                                  </Descriptions.Item>
                              )}
                          </Descriptions>
                      ),
                  },
              ]
            : [
                  {
                      key: 'moaaoa',
                      label: 'MOA & AOA',
                      children: (
                          <Descriptions column={2} size="small" bordered>
                              <Descriptions.Item label="MOA Type">
                                  {application.moaAoa?.moaType || '-'}
                              </Descriptions.Item>
                              <Descriptions.Item label="AOA Type">
                                  {application.moaAoa?.aoaType || '-'}
                              </Descriptions.Item>
                              {application.moaAoa?.mainObjectTemplate && (
                                  <Descriptions.Item label="Main Object Template" span={2}>
                                      {application.moaAoa.mainObjectTemplate}
                                  </Descriptions.Item>
                              )}
                              {application.moaAoa?.mainObjectCustomText && (
                                  <Descriptions.Item label="Custom Main Object" span={2}>
                                      {application.moaAoa.mainObjectCustomText}
                                  </Descriptions.Item>
                              )}
                          </Descriptions>
                      ),
                  },
              ]),
        {
            key: 'documents',
            label: `Documents (${application.documents?.length ?? 0})`,
            children:
                (application.documents?.length ?? 0) === 0 ? (
                    <Text type="secondary">No documents uploaded.</Text>
                ) : (
                    <Flex vertical gap={8}>
                        {application.documents?.map((doc: AdminDocument) => (
                            <Flex
                                key={doc.docType}
                                justify="space-between"
                                align="center"
                                className="border border-solid border-gray-200 rounded px-3 py-2"
                            >
                                <Flex vertical>
                                    <Text strong>
                                        {doc.docType
                                            .replace(/_(\d+)_/g, (_, n) => ` ${parseInt(n, 10) + 1} `)
                                            .replace(/^Director/i, isLlp ? 'Partner' : 'Director')
                                            .replace(/_/g, ' ')
                                            .replace(/\b\w/g, c => c.toUpperCase())
                                            .replace(/\s+/g, ' ')
                                            .trim()}
                                    </Text>
                                    <Text type="secondary" className="text-xs">
                                        {doc.fileName}
                                    </Text>
                                </Flex>
                                {doc.vendorUrl ? (
                                    <a
                                        href={doc.vendorUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brandColor"
                                    >
                                        View
                                    </a>
                                ) : (
                                    <Text type="secondary" className="text-xs">
                                        No URL
                                    </Text>
                                )}
                            </Flex>
                        ))}
                    </Flex>
                ),
        },
        {
            key: 'vendor',
            label: `Vendor Timeline (${application.vendorStages?.length ?? 0} stages)`,
            children:
                (application.vendorStages?.length ?? 0) === 0 ? (
                    <Text type="secondary">No vendor stages available yet.</Text>
                ) : (
                    <Timeline
                        items={application.vendorStages?.map((stage: VendorStage) => ({
                            dot: STAGE_ICON[stage.state],
                            children: (
                                <Flex vertical gap={4}>
                                    <Flex align="center" gap={8}>
                                        <Text strong>{stage.title}</Text>
                                        <Tag color={STAGE_COLOR[stage.state]}>{stage.state}</Tag>
                                    </Flex>
                                    {stage.description && (
                                        <Text type="secondary">{stage.description}</Text>
                                    )}
                                    {stage.location && (
                                        <Text type="secondary" className="text-xs">
                                            {stage.location}
                                        </Text>
                                    )}
                                    {stage.date && (
                                        <Text type="secondary" className="text-xs">
                                            {formattedDateOnly(new Date(stage.date))}
                                        </Text>
                                    )}
                                </Flex>
                            ),
                        }))}
                    />
                ),
        },
    ];

    return (
        <DrawerModal
            open={open}
            handleCancel={onClose}
            modalTitle={`Application — ${application.applicationId}`}
            closeIcon
            width={900}
        >
            {loading ? (
                <Flex justify="center" align="center" className="h-64">
                    <Spin size="large" />
                </Flex>
            ) : (
                <Collapse
                    items={items}
                    defaultActiveKey={['overview', 'basic']}
                    className="w-full"
                />
            )}
        </DrawerModal>
    );
};

export default ApplicationDetailDrawer;
