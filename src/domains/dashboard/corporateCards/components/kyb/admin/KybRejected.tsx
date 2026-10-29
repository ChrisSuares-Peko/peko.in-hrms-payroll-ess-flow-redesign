import { ReactNode } from 'react';

import { CloseCircleFilled } from '@ant-design/icons';
import { Button, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { KYB_REJECTED } from '../../../utils/kybData';

const { Title, Text } = Typography;

const InfoCell = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-1">
        <Text className="text-[10px] text-textBody sm:text-xs">{label}</Text>
        <div className="break-words text-xs font-medium text-textHeadings sm:text-sm">{value}</div>
    </div>
);

interface KybRejectedProps {
    onResubmit: () => void;
    resubmitLoading?: boolean;
}

const KybRejected = ({ onResubmit, resubmitLoading }: KybRejectedProps) => {
    const { kybInfo } = useAppSelector(state => state.reducer.corporateCards);

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-4 text-center sm:gap-8 xl:py-8">
            <span className="relative flex size-20 items-center justify-center rounded-full bg-bgLightPink/30 sm:size-28">
                <span className="absolute size-14 rounded-full bg-bgLightPink/60 sm:size-20" />
                <CloseCircleFilled className="relative text-4xl text-textLightRed sm:text-5xl" />
            </span>

            <div className="flex flex-col gap-2 sm:gap-3">
                <Title level={3} className="!mb-0 !text-xl !text-textHeadings sm:!text-2xl">
                    {KYB_REJECTED.title}
                </Title>
                <Text className="text-sm text-textBody">{KYB_REJECTED.description}</Text>
            </div>

            <div className="w-full overflow-hidden rounded-2xl border border-borderCard">
                <div className="grid grid-cols-1 gap-3 bg-bgGray px-4 py-3 text-left sm:grid-cols-3 sm:px-6 sm:py-4">
                    <InfoCell
                        label="Current Status"
                        value={
                            <span className="flex items-center gap-1.5 font-medium text-errorTextRed">
                                <span className="size-1.5 rounded-full bg-errorTextRed" />
                                Rejected
                            </span>
                        }
                    />
                    <InfoCell label="Ref ID" value={kybInfo.refId ?? '—'} />
                    <InfoCell label="Last Updated" value={kybInfo.submittedOn ?? '—'} />
                </div>
                <div className="whitespace-pre-line break-words border-t border-borderCard px-4 py-3 text-center text-[10px] text-textHeadings sm:py-4 sm:text-xs">
                    <span className="font-semibold">{KYB_REJECTED.reasonPrefix}</span>{' '}
                    <span className="font-semibold">
                        {kybInfo.rejectionReason ?? 'No reason provided.'}
                    </span>
                </div>
            </div>

            <Button
                type="primary"
                danger
                onClick={onResubmit}
                loading={resubmitLoading}
                className="!h-10 !px-8 text-sm font-medium sm:!h-12 sm:!px-10 sm:text-base"
            >
                {KYB_REJECTED.ctaLabel}
            </Button>
        </div>
    );
};

export default KybRejected;
