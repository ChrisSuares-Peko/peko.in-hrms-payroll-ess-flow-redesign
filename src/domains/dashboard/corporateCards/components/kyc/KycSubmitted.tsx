import { ReactNode } from 'react';

import { Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { KYC_SUBMISSION_INFO, KYC_SUBMITTED } from '../../utils/kycData';
import SuccessCheck from '../common/SuccessCheck';

const { Title, Text } = Typography;

const InfoCell = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex flex-col gap-2">
        <Text className="text-sm text-textBody">{label}</Text>
        <div className="text-base font-medium text-textHeadings">{value}</div>
    </div>
);

/** Post-submission state: success confirmation + under-review status. */
const KycSubmitted = () => {
    const { kycInfo } = useAppSelector(state => state.reducer.corporateCards);

    return (
        <div className="flex w-full flex-col">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 py-4 text-center xl:py-8">
                <div className="flex flex-col items-center gap-4">
                    <SuccessCheck />
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        {KYC_SUBMITTED.title}
                    </Title>
                    <Text className="text-base text-textBody">{KYC_SUBMITTED.description}</Text>
                </div>

                <div className="w-full overflow-hidden rounded-2xl border border-borderCard">
                    <div className="grid grid-cols-1 gap-4 bg-bgGray px-6 py-5 text-left sm:grid-cols-3">
                        <InfoCell
                            label="Current Status"
                            value={
                                <span className="flex items-center gap-2 font-medium text-textOrange">
                                    <span className="size-2 rounded-full bg-textOrange" />
                                    {KYC_SUBMISSION_INFO.status}
                                </span>
                            }
                        />
                        <InfoCell label="Ref ID" value={kycInfo.refId ?? '—'} />
                        <InfoCell label="Submitted On" value={kycInfo.submittedOn ?? '—'} />
                    </div>
                    <div className="border-t border-borderCard px-4 py-5 text-center text-base text-textBody">
                        {KYC_SUBMITTED.expectedCompletionPrefix}{' '}
                        <span className="font-bold text-textHeadings">
                            {KYC_SUBMISSION_INFO.expectedCompletion}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KycSubmitted;
