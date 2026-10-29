import { CheckCircleFilled, ClockCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

import { TrackingStep as TrackingStepData, TrackingStatus } from '../utils/tracking';

const { Text } = Typography;

const BADGE: Record<TrackingStatus, { label: string; className: string }> = {
    completed: { label: 'Completed', className: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
    processing: { label: 'Processing', className: 'bg-[#f6f3ff] text-[#7c3aed] border-[#ddd6fe]' },
    delayed: { label: 'Delayed', className: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]' },
    pending: { label: 'Pending', className: 'bg-[#f5f5f5] text-[#64748b] border-[#e5e7eb]' },
};

const StatusIcon = ({ status }: { status: TrackingStatus }) => {
    if (status === 'completed') return <CheckCircleFilled style={{ fontSize: 22, color: '#22c55e' }} />;
    if (status === 'delayed') return <ClockCircleFilled style={{ fontSize: 22, color: '#d97706' }} />;
    if (status === 'processing')
        return (
            <span className="w-[22px] h-[22px] rounded-full bg-[#f6f3ff] flex items-center justify-center">
                <LoadingOutlined spin style={{ fontSize: 13, color: '#7c3aed' }} />
            </span>
        );
    return <span className="w-[22px] h-[22px] rounded-full border-2 border-[#e5e7eb] block" />;
};

interface TrademarkTrackingStepProps {
    step: TrackingStepData;
    isLast: boolean;
}

// Same visual template as BusinessRegistration's own TrackingStep — kept as
// a domain-scoped copy (not a cross-import) since it's a stateful UI
// component, per this session's established convention.
const TrademarkTrackingStep = ({ step, isLast }: TrademarkTrackingStepProps) => {
    const badge = BADGE[step.status];
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
                <StatusIcon status={step.status} />
                {!isLast && (
                    <div
                        className={`w-px flex-1 my-1 ${step.status === 'completed' ? 'bg-[#22c55e]' : 'bg-[#e5e7eb]'}`}
                    />
                )}
            </div>
            <div className="flex-1 pb-6">
                <div className="bg-[#fafafa] rounded-[12px] p-4 flex items-start justify-between gap-3">
                    <div>
                        <Text className="!block !text-[15px] !font-semibold !text-[#1e293b]">{step.title}</Text>
                        <Text className="!block !text-[13px] !text-[#6a7282] !mt-[2px]">{step.description}</Text>
                        {step.date && (
                            <Text className="!block !text-[12px] !text-[#94a3b8] !mt-1">{step.date}</Text>
                        )}
                    </div>
                    <span className={`text-[12px] px-2 py-[2px] rounded-[6px] border whitespace-nowrap ${badge.className}`}>
                        {badge.label}
                    </span>
                </div>
                {(step.note || step.pendingWith) && (
                    <div className="mt-2 bg-white border border-[#ebebeb] rounded-[10px] p-3">
                        <Text className="!block !text-[13px] !font-semibold !text-[#1e293b]">
                            What&apos;s happening now?
                        </Text>
                        {step.pendingWith && (
                            <Text className="!block !text-[13px] !font-medium !text-[#b45309]">
                                {step.pendingWith}
                            </Text>
                        )}
                        {step.note && <Text className="!text-[13px] !text-[#6a7282]">{step.note}</Text>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrademarkTrackingStep;
