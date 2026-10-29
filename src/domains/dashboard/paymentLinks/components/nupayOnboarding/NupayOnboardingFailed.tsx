import { CloseOutlined } from '@ant-design/icons';
import { Card, Flex, Typography } from 'antd';

import { getEntityOnboardingFields } from './entityDocuments';
import { OnboardingRecord } from '../../types/paymentLinkTypes';

interface RejectedDocument {
    name: string;
    reason: string;
}

interface Props {
    record?: OnboardingRecord | null;
    title?: string;
}

// NuPay's onboarding webhook returns a single message (record.remarks). If it ever also
// sends a per-document breakdown we surface it in the table; otherwise only the reason shows.
const getRejectedDocuments = (record?: OnboardingRecord | null): RejectedDocument[] => {
    const pr = record?.providerResponse as any;
    const raw = pr?.rejectionDocuments || pr?.onboardingWebhook?.documents || pr?.onboardingWebhook?.rejected_documents;
    if (!Array.isArray(raw)) return [];
    const labels = Object.fromEntries(getEntityOnboardingFields(record?.entityType || undefined).map(f => [f.name, f.label]));
    return raw
        .map((d: any) => ({
            name: labels[d?.name] || d?.label || d?.name || 'Document',
            reason: d?.reason || d?.message || 'Rejected',
        }))
        .filter(d => d.name);
};

const NupayOnboardingFailed = ({ record, title = 'Payment Links' }: Props) => {
    const reason =
        record?.remarks ||
        `Your ${title} onboarding verification could not be completed. Our team will reach out with the next steps.`;
    const documents = getRejectedDocuments(record);

    return (
        <Flex align="center" justify="center" className="w-full px-3 py-6">
            <Card
                bordered={false}
                className="w-full max-w-[818px] rounded-[28px] !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                styles={{ body: { padding: 'clamp(28px, 5vw, 54px)' } }}
            >
                <Flex vertical gap={30} align="center">
                    <Flex vertical gap={16} align="center" className="w-full">
                        <Flex
                            align="center"
                            justify="center"
                            className="h-[100px] w-[100px] rounded-full"
                            style={{ background: '#FFF1F2' }}
                        >
                            <Flex
                                align="center"
                                justify="center"
                                className="h-[75px] w-[75px] rounded-full"
                                style={{ background: '#FFE4E6' }}
                            >
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="h-[46px] w-[46px] rounded-full"
                                    style={{ background: '#FF4F4F' }}
                                >
                                    <CloseOutlined className="text-[20px] text-white" />
                                </Flex>
                            </Flex>
                        </Flex>
                        <Typography.Title
                            level={3}
                            className="!mb-0 text-center !text-[26px] !font-semibold !leading-[1.3] !text-[#111827]"
                        >
                            {title} Onboarding Verification Failed
                        </Typography.Title>
                        <Typography.Text className="max-w-[622px] text-center text-[15px] leading-6 text-[#52525B]">
                            Your {title} onboarding verification could not be completed
                        </Typography.Text>
                    </Flex>

                    <Flex vertical gap={20} className="w-full">
                        <Flex vertical gap={8} className="w-full rounded-lg p-5" style={{ background: '#FFF8F8' }}>
                            <Typography.Text className="text-[15px] font-semibold capitalize text-[#FF4F4F]">
                                Reason for Rejection
                            </Typography.Text>
                            <Typography.Text className="text-[14px] leading-6 text-[#475569]">{reason}</Typography.Text>
                        </Flex>

                        {documents.length > 0 && (
                            <div className="w-full overflow-hidden rounded-lg !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                                <Flex className="bg-[#F5F5F7] px-4 py-2.5 text-[12px] font-semibold text-[#66666E]">
                                    <span className="w-[45%]">Document Name</span>
                                    <span className="w-[20%]">Status</span>
                                    <span className="w-[35%]">Reason</span>
                                </Flex>
                                {documents.map((doc, i) => (
                                    <Flex
                                        key={`${doc.name}-${i}`}
                                        align="center"
                                        className={`px-4 py-3 ${i < documents.length - 1 ? 'border-b border-[#EDEDED]' : ''}`}
                                    >
                                        <span className="w-[45%] text-[13px] text-[#212121]">{doc.name}</span>
                                        <span className="w-[20%]">
                                            <span className="rounded-xl bg-[#FFEDED] px-2.5 py-1 text-[11px] font-medium text-[#DB3333]">
                                                Rejected
                                            </span>
                                        </span>
                                        <span className="w-[35%] text-[13px] text-[#66666E]">{doc.reason}</span>
                                    </Flex>
                                ))}
                            </div>
                        )}
                    </Flex>
                </Flex>
            </Card>
        </Flex>
    );
};

export default NupayOnboardingFailed;
