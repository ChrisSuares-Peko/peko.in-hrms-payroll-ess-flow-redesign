import { ReactNode } from 'react';

import { Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { KYB_SUBMITTED } from '../../../utils/kybData';
import SuccessCheck from '../../common/SuccessCheck';

const { Title, Text } = Typography;

const InfoCell = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-1">
        <Text className="text-[10px] text-textBody sm:text-xs">{label}</Text>
        <div className="break-words text-xs font-medium text-textHeadings sm:text-sm">{value}</div>
    </div>
);

const KybSubmitted = () => {
    const { kybInfo } = useAppSelector(state => state.reducer.corporateCards);

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-4 text-center sm:gap-8 xl:py-8">
            <SuccessCheck />

            <div className="flex flex-col gap-2 sm:gap-3">
                <Title level={3} className="!mb-0 !text-xl !text-textHeadings sm:!text-2xl">
                    {KYB_SUBMITTED.title}
                </Title>
                <Text className="text-sm text-textBody ">{KYB_SUBMITTED.description}</Text>
            </div>

            <div className="w-full overflow-hidden rounded-2xl border border-borderCard">
                <div className="grid grid-cols-1 gap-3 bg-bgGray px-4 py-3 text-left sm:grid-cols-3 sm:px-6 sm:py-4">
                    <InfoCell
                        label="Current Status"
                        value={
                            <span className="flex items-center gap-1.5 font-medium text-textOrange">
                                <span className="size-1.5 rounded-full bg-textOrange" />
                                {KYB_SUBMITTED.statusLabel}
                            </span>
                        }
                    />
                    <InfoCell label="Ref ID" value={kybInfo.refId ?? '—'} />
                    <InfoCell label="Last Updated" value={kybInfo.submittedOn ?? '—'} />
                </div>
                <div className="border-t border-borderCard px-4 py-3 text-center text-xs text-textBody sm:py-4 sm:text-sm">
                    {KYB_SUBMITTED.expectedCompletionPrefix}{' '}
                    <span className="font-bold text-textHeadings">
                        {KYB_SUBMITTED.expectedCompletion}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default KybSubmitted;
