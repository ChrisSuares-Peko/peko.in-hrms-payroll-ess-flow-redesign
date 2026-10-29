import { DownloadOutlined, EyeOutlined, FileWordOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Tag, Tooltip, Typography } from 'antd';

import { CorporateAgreementReview } from '../../types/corporateDocuments';

const ESIGN_LABELS: Record<string, { label: string; tone: 'warning' | 'success' | 'error' }> = {
    PENDING_DISPATCH: { label: 'Generated, not yet sent for e-signature', tone: 'warning' },
    SENT: { label: 'Sent for e-signature, awaiting the signature', tone: 'warning' },
    SIGNED: { label: 'e-Signature completed', tone: 'success' },
    FAILED: { label: 'e-Signature failed', tone: 'error' },
};

const TONE_STYLE = {
    warning: { color: '#D97706', bg: '#FFFBEB' },
    success: { color: '#3AB75E', bg: '#ECFDF3' },
    error: { color: '#DC2626', bg: '#FEF2F2' },
};

interface AgreementReviewPanelProps {
    review: CorporateAgreementReview | null;
    loadFailed?: boolean;
    onRetry?: () => void;
    onRegenerate: () => void;
    onOpenGenerated?: (docKey: string, mode: 'view' | 'download') => void;
    isOpening?: (docKey: string, mode: 'view' | 'download') => boolean;
    regenerating?: boolean;
}

const AgreementReviewPanel = ({
    review,
    loadFailed,
    onRetry,
    onRegenerate,
    onOpenGenerated,
    isOpening = () => false,
    regenerating,
}: AgreementReviewPanelProps) => {
    // A vanished panel reads as "this corporate has no agreement", which is a different fact entirely.
    if (loadFailed) {
        return (
            <Alert
                type="warning"
                showIcon
                message="We could not load the corporate agreement details."
                action={
                    <Button size="small" danger onClick={onRetry}>
                        Retry
                    </Button>
                }
            />
        );
    }

    if (!review) return null;

    const esign = review.esignStatus ? ESIGN_LABELS[review.esignStatus] : undefined;
    const tone = esign ? TONE_STYLE[esign.tone] : undefined;
    const missingCount = review.missingFields?.length ?? 0;

    return (
        <div className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6">
            <Flex justify="space-between" align="start" wrap gap={12} className="mb-4">
                <Flex vertical gap={2}>
                    <Typography.Title level={5} className="!mb-0">
                        Corporate Agreement details
                    </Typography.Title>
                    <Typography.Text className="text-xs text-textBody">
                        What the corporate typed into the form, used to fill the agreement document
                    </Typography.Text>
                </Flex>
                <Flex gap={8} align="center" wrap>
                    {review.generatedPdfKey && (
                        <>
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                loading={isOpening(review.generatedPdfKey, 'view')}
                                onClick={() =>
                                    onOpenGenerated?.(review.generatedPdfKey as string, 'view')
                                }
                            >
                                View PDF
                            </Button>
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                loading={isOpening(review.generatedPdfKey, 'download')}
                                onClick={() =>
                                    onOpenGenerated?.(review.generatedPdfKey as string, 'download')
                                }
                            >
                                Download PDF
                            </Button>
                        </>
                    )}
                    {review.generatedDocumentKey && (
                        <Button
                            size="small"
                            icon={<FileWordOutlined />}
                            loading={isOpening(review.generatedDocumentKey, 'download')}
                            onClick={() =>
                                onOpenGenerated?.(review.generatedDocumentKey as string, 'download')
                            }
                        >
                            Download Word
                        </Button>
                    )}
                    {review.generatedDocumentKey && !review.generatedPdfKey && (
                        <Tooltip title="This agreement was generated before PDFs were stored. Regenerate it to produce one.">
                            <Typography.Text className="text-xs italic text-textGreyLight">
                                No PDF yet
                            </Typography.Text>
                        </Tooltip>
                    )}
                    {esign && tone && (
                        <Tag
                            className="rounded-full border-0 px-2.5 py-0.5 text-xs"
                            style={{ backgroundColor: tone.bg, color: tone.color }}
                        >
                            {esign.label}
                        </Tag>
                    )}
                    <Tooltip
                        title={
                            review.canResend
                                ? 'Re-render the agreement from these details and queue it again'
                                : 'The agreement details are incomplete, so there is nothing to regenerate'
                        }
                    >
                        <Button
                            size="small"
                            icon={<ReloadOutlined />}
                            loading={regenerating}
                            disabled={!review.canResend}
                            onClick={onRegenerate}
                        >
                            Regenerate & requeue
                        </Button>
                    </Tooltip>
                </Flex>
            </Flex>

            {!review.groups && (
                <Alert
                    type="info"
                    showIcon
                    message="This corporate has not filled in any agreement details. That is expected when it chose to upload a signed copy instead."
                />
            )}

            {review.groups && missingCount > 0 && (
                <Alert
                    className="mb-4"
                    type="warning"
                    showIcon
                    message={`${missingCount} required field${missingCount === 1 ? '' : 's'} still empty — the agreement cannot be generated yet.`}
                />
            )}

            {review.groups?.map(group => (
                <div key={group.key} className="mb-4 last:mb-0">
                    <Typography.Text className="text-sm font-medium text-textHeadings">
                        {group.label}
                    </Typography.Text>
                    <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.fields.map(field => (
                            <Flex key={field.key} vertical gap={1} className="min-w-0">
                                <Typography.Text className="text-xs text-textGreyLight">
                                    {field.label}
                                </Typography.Text>
                                <Typography.Text
                                    className={
                                        field.value
                                            ? 'break-words text-sm font-medium text-textHeadings'
                                            : 'text-sm italic text-textGreyLight'
                                    }
                                >
                                    {field.value ?? (field.required ? 'Not provided' : '—')}
                                </Typography.Text>
                            </Flex>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AgreementReviewPanel;
