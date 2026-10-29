import { Flex, Progress, Tag, Typography } from 'antd';

import { KYB_STATUS_META, KYB_STEP_META } from './statusMeta';
import { KybStatus } from '../../types/corporateCardApplications';
import { KybProgressStep } from '../../types/corporateDocuments';

interface KybProgressPanelProps {
    steps: KybProgressStep[];
    businessType: string | null;
    kybStatus?: string | null;
    rejectionReason?: string | null;
}

const KybProgressPanel = ({
    steps,
    businessType,
    kybStatus,
    rejectionReason,
}: KybProgressPanelProps) => {
    if (!steps.length) return null;

    const completed = steps.filter(step => step.state === 'done').length;
    const countable = steps.filter(step => step.state !== 'not_applicable').length;
    // Not-applicable steps are excluded from the denominator, so an upload-route corporate can still
    // reach 100% without a step it was never asked to do.
    const percent = countable ? Math.round((completed / countable) * 100) : 0;
    const statusMeta = kybStatus ? KYB_STATUS_META[kybStatus as KybStatus] : undefined;

    return (
        <div className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6">
            <Flex justify="space-between" align="center" wrap gap={8} className="mb-4">
                <Flex vertical gap={2}>
                    <Typography.Title level={5} className="!mb-0">
                        Steps completed by the corporate
                    </Typography.Title>
                    <Typography.Text className="text-xs text-textBody">
                        {completed} of {countable} steps
                        {businessType ? ` · ${businessType}` : ' · business type not chosen'}
                    </Typography.Text>
                </Flex>
                <Flex align="center" gap={10} className="min-w-[180px] flex-1 sm:max-w-[260px]">
                    <Progress
                        percent={percent}
                        size="small"
                        strokeColor={percent === 100 ? '#3AB75E' : '#D97706'}
                        showInfo={false}
                        className="!mb-0 flex-1"
                    />
                    <Typography.Text
                        aria-label="KYB progress"
                        className="shrink-0 text-sm font-semibold text-textHeadings"
                    >
                        {percent}%
                    </Typography.Text>
                </Flex>
                {statusMeta && (
                    <Tag
                        className="shrink-0 rounded-full border-0 px-2.5 py-0.5 text-xs"
                        style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
                    >
                        {statusMeta.label}
                    </Tag>
                )}
            </Flex>

            {rejectionReason && (
                <Typography.Paragraph className="!mb-4 whitespace-pre-line break-words text-xs text-errorTextRed">
                    Rejected: {rejectionReason}
                </Typography.Paragraph>
            )}

            <Flex vertical gap={0}>
                {steps.map((step, index) => {
                    const meta = KYB_STEP_META[step.state];

                    return (
                        <Flex
                            key={step.key}
                            justify="space-between"
                            align="center"
                            gap={12}
                            className="border-borderDivider py-3"
                            style={{
                                borderBottomWidth: index === steps.length - 1 ? 0 : 1,
                                borderBottomStyle: 'solid',
                            }}
                        >
                            <Flex gap={10} align="center" className="min-w-0">
                                <span
                                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                    style={{ backgroundColor: meta.bg, color: meta.color }}
                                >
                                    {index + 1}
                                </span>
                                <Flex vertical className="min-w-0">
                                    <Typography.Text className="font-medium">
                                        {step.label}
                                    </Typography.Text>
                                    {step.detail && (
                                        <Typography.Text className="text-xs text-textGreyLight">
                                            {step.detail}
                                        </Typography.Text>
                                    )}
                                </Flex>
                            </Flex>
                            <Tag
                                className="shrink-0 rounded-full border-0 px-2 text-xs"
                                style={{ backgroundColor: meta.bg, color: meta.color }}
                            >
                                {meta.label}
                            </Tag>
                        </Flex>
                    );
                })}
            </Flex>
        </div>
    );
};

export default KybProgressPanel;
