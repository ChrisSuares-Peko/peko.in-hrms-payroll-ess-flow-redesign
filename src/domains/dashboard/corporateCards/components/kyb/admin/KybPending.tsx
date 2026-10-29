import { ReactNode } from 'react';

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Typography } from 'antd';

import { KYB_STATUS_META } from '@domains/admin/manage/component/corporateCardApplications/statusMeta';
import { KybStatus } from '@domains/admin/manage/types/corporateCardApplications';
import { useAppSelector } from '@src/hooks/store';

import { KYB_PENDING } from '../../../utils/kybData';

const { Title, Text } = Typography;

const InfoCell = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-1">
        <Text className="text-[10px] text-textBody sm:text-xs">{label}</Text>
        <div className="break-words text-xs font-medium text-textHeadings sm:text-sm">{value}</div>
    </div>
);

const KybPending = () => {
    const { kybInfo } = useAppSelector(state => state.reducer.corporateCards);
    const currentStatusLabel =
        (kybInfo.kybStatus && KYB_STATUS_META[kybInfo.kybStatus as KybStatus]?.label) ||
        KYB_PENDING.statusLabel;

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-4 text-center sm:gap-8 xl:py-8">
            <span className="relative flex size-20 items-center justify-center rounded-full bg-orange-100 sm:size-24">
                <span className="absolute size-14 rounded-full bg-orange-200 sm:size-16" />
                <ExclamationCircleFilled className="relative text-4xl text-textOrange sm:text-5xl" />
            </span>

            <div className="flex flex-col gap-2 sm:gap-3">
                <Title level={3} className="!mb-0 !text-xl !text-textHeadings sm:!text-2xl">
                    {KYB_PENDING.title}
                </Title>
                <Text className="text-sm text-textBody ">{KYB_PENDING.description}</Text>
            </div>

            <div className="w-full overflow-hidden rounded-2xl border border-borderCard">
                <div className="grid grid-cols-1 gap-3 bg-bgGray px-4 py-3 text-left sm:grid-cols-3 sm:px-6 sm:py-4">
                    <InfoCell
                        label="Current Status"
                        value={
                            <span className="flex items-center gap-2 font-medium text-textOrange">
                                <span className="size-1.5 rounded-full bg-textOrange" />
                                {currentStatusLabel}
                            </span>
                        }
                    />
                    <InfoCell label="Ref ID" value={kybInfo.refId ?? '—'} />
                    <InfoCell label="Last Updated" value={kybInfo.submittedOn ?? '—'} />
                </div>
                <div className="border-t border-borderCard px-4 py-3 text-center text-xs text-textBody sm:py-4 sm:text-sm">
                    {KYB_PENDING.expectedCompletionPrefix}{' '}
                    <span className="font-bold text-textHeadings">
                        {KYB_PENDING.expectedCompletion}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default KybPending;
