import { CloseCircleFilled } from '@ant-design/icons';
import { Card, Flex, Table, Tag, Typography } from 'antd';

interface PayoutRejectedProps {
    rejectionReason?: string | null;
}

const DOC_KEYWORD_MAP: { keywords: string[]; label: string }[] = [
    { keywords: ['pan', 'gst'], label: 'PAN / GST Document' },
    { keywords: ['bank account', 'cancelled cheque', 'canceled cheque', 'cheque'], label: 'Bank Account / Cancelled Cheque' },
    { keywords: ['address', 'office'], label: 'Business Address' },
    { keywords: ['registered name', 'business name', 'merchant name'], label: 'Business Name / Registration' },
    { keywords: ['mobile', 'phone', 'contact number'], label: 'Contact Number' },
    { keywords: ['email'], label: 'Email Address' },
    { keywords: ['website'], label: 'Website URL' },
    { keywords: ['pincode', 'pin code', 'zip'], label: 'Pincode' },
    { keywords: ['ifsc', 'account number'], label: 'Bank Account Details' },
];

function getAffectedDocsWithReasons(reason: string): { document: string; reason: string }[] {
    const sentences = reason.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) ?? [reason];
    const usedLabels = new Set<string>();
    const matched: { document: string; reason: string }[] = [];

    sentences.forEach(sentence => {
        const sentenceLower = sentence.toLowerCase();
        DOC_KEYWORD_MAP.forEach(({ keywords, label }) => {
            if (!usedLabels.has(label) && keywords.some(k => sentenceLower.includes(k))) {
                matched.push({ document: label, reason: sentence });
                usedLabels.add(label);
            }
        });
    });

    const fullLower = reason.toLowerCase();
    DOC_KEYWORD_MAP.forEach(({ keywords, label }) => {
        if (!usedLabels.has(label) && keywords.some(k => fullLower.includes(k))) {
            matched.push({ document: label, reason });
            usedLabels.add(label);
        }
    });

    return matched;
}

const PayoutRejected = ({ rejectionReason }: PayoutRejectedProps) => {
    const affectedDocs = rejectionReason ? getAffectedDocsWithReasons(rejectionReason) : [];

    const tableData = affectedDocs.map((item, idx) => ({
        key: idx,
        document: item.document,
        reason: item.reason,
    }));

    const columns = [
        {
            title: 'Document / Field',
            dataIndex: 'document',
            key: 'document',
            width: 220,
            render: (text: string) => (
                <Typography.Text className="text-[14px] font-medium text-[#1F2A44]">{text}</Typography.Text>
            ),
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            render: (text: string) => (
                <Typography.Text className="text-[13px] leading-[1.6] text-[#475569]">{text}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 160,
            render: () => <Tag color="error">Verification Failed</Tag>,
        },
    ];

    return (
        <Flex align="center" justify="center" className="w-full px-3 py-8">
            <Card
                className="w-full max-w-[700px] rounded-[20px] border border-[#D7E2F0] shadow-none"
                styles={{ body: { padding: '40px 48px' } }}
            >
                <Flex vertical gap={28} align="center">
                    {/* Icon */}
                    <Flex
                        align="center"
                        justify="center"
                        style={{ width: 100, height: 100, borderRadius: '50%', background: '#fff1f2' }}
                    >
                        <Flex
                            align="center"
                            justify="center"
                            style={{ width: 75, height: 75, borderRadius: '50%', background: '#ffe4e6' }}
                        >
                            <CloseCircleFilled style={{ fontSize: 50, color: '#FF4D4F' }} />
                        </Flex>
                    </Flex>

                    {/* Title */}
                    <Flex vertical gap={8} align="center">
                        <Typography.Title
                            level={2}
                            className="!mb-0 !text-center !text-[26px] !font-semibold !leading-[1.3] !text-[#1F2A44]"
                        >
                            Payout Onboarding Verification Failed
                        </Typography.Title>
                        <Typography.Text className="text-center text-[15px] leading-6 text-[#52525B]">
                            Your payout onboarding verification could not be completed.
                        </Typography.Text>
                    </Flex>

                    {/* Reason box */}
                    <div
                        className="w-full rounded-lg p-5"
                        style={{ background: '#fff8f8', border: '1px solid #ffd6d6' }}
                    >
                        <Typography.Text
                            className="mb-2 block text-[13px] font-semibold uppercase"
                            style={{ color: '#FF4D4F' }}
                        >
                            Reason for Rejection
                        </Typography.Text>
                        <Typography.Text className="text-[14px] leading-6 text-[#475569]">
                            {rejectionReason || 'Your submitted documents could not be verified. Please review your details and resubmit.'}
                        </Typography.Text>
                    </div>

                    {/* Dynamic document breakdown table */}
                    {tableData.length > 0 && (
                        <div className="w-full">
                            <Typography.Text className="mb-3 block text-[13px] font-semibold uppercase text-[#6B7280]">
                                Affected Documents
                            </Typography.Text>
                            <Table
                                dataSource={tableData}
                                columns={columns}
                                pagination={false}
                                size="small"
                                className="rounded-lg border border-[#E5E7EB]"
                            />
                        </div>
                    )}


                </Flex>
            </Card>
        </Flex>
    );
};

export default PayoutRejected;
