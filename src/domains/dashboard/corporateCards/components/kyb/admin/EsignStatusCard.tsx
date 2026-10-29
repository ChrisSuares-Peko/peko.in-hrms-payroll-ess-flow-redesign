import { Button, Divider, Spin, Typography } from 'antd';

import { formatCompleteDate } from '@utils/dateFormat';

import { ESIGN_STATUS } from '../../../hooks/admin/useCorporateAgreement';
import { KYB_AGREEMENT } from '../../../utils/kybData';

const { Text } = Typography;

interface EsignStatusCardProps {
    status?: string | null;
    signingLink?: string | null;
    sentAt?: string | null;
    failureReason?: string | null;
}

const COPY = {
    [ESIGN_STATUS.PENDING_DISPATCH]: KYB_AGREEMENT.esignPreparing,
    [ESIGN_STATUS.SENT]: KYB_AGREEMENT.esignAwaiting,
    [ESIGN_STATUS.SIGNED]: KYB_AGREEMENT.esignSigned,
    [ESIGN_STATUS.FAILED]: KYB_AGREEMENT.esignFailed,
};

const TONE = {
    [ESIGN_STATUS.PENDING_DISPATCH]: 'bg-bgLightPink text-textLightRed',
    [ESIGN_STATUS.SENT]: 'bg-bgLightPink text-textLightRed',
    [ESIGN_STATUS.SIGNED]: 'bg-savingsTagLightBg text-savingsTagLightText',
    [ESIGN_STATUS.FAILED]: 'bg-bgLightPink text-textLightRed',
};

const DOT = {
    [ESIGN_STATUS.PENDING_DISPATCH]: 'bg-textLightRed',
    [ESIGN_STATUS.SENT]: 'bg-textLightRed',
    [ESIGN_STATUS.SIGNED]: 'bg-savingsTagLightText',
    [ESIGN_STATUS.FAILED]: 'bg-textLightRed',
};

const EsignStatusCard = ({
    status,
    signingLink,
    sentAt,
    failureReason,
}: EsignStatusCardProps) => {
    const current = (status as keyof typeof COPY) ?? ESIGN_STATUS.PENDING_DISPATCH;
    const copy = COPY[current] ?? KYB_AGREEMENT.esignPreparing;
    const isAwaiting = current === ESIGN_STATUS.SENT;
    const isFailed = current === ESIGN_STATUS.FAILED;

    return (
        <div className="overflow-hidden rounded-2xl border border-borderGray bg-white sm:rounded-[20px]">
            <div className="flex flex-col items-start gap-3 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
                <span
                    className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        TONE[current] ?? TONE[ESIGN_STATUS.PENDING_DISPATCH]
                    }`}
                >
                    <span
                        className={`size-1.5 rounded-full ${
                            DOT[current] ?? DOT[ESIGN_STATUS.PENDING_DISPATCH]
                        }`}
                    />
                    {copy.badge}
                </span>
                <Text className="text-sm font-bold text-textHeadings sm:text-base">
                    {copy.title}
                </Text>
                <Text className="text-xs text-textBody sm:text-sm">{copy.description}</Text>
                {isFailed && failureReason && (
                    <Text className="text-xs text-textLightRed sm:text-sm">{failureReason}</Text>
                )}
                {isAwaiting && sentAt && (
                    <Text className="text-xs text-textGreyLight">
                        {`${KYB_AGREEMENT.esignSentOn} ${formatCompleteDate(new Date(sentAt))}`}
                    </Text>
                )}
            </div>

            {isAwaiting && (
                <>
                    <Divider className="!my-0" />
                    <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-4 sm:px-6 sm:py-5">
                        <Spin size="small" />
                        <Text className="text-xs font-medium text-textGreyLight sm:text-sm">
                            {KYB_AGREEMENT.esignChecking}
                        </Text>
                        {signingLink && (
                            <Button
                                type="primary"
                                size="small"
                                className="ml-auto"
                                href={signingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {KYB_AGREEMENT.esignSignNow}
                            </Button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default EsignStatusCard;
