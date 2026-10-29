import { Flex, Typography } from 'antd';

import useCompanyInfoApi from '@domains/dashboard/profile/hooks/useCompanyInfoApi';
import { useAppSelector } from '@src/hooks/store';

import { companyInfo } from '../../utils/gstSummaryData';

const { Title, Text } = Typography;

interface GstCompanyBarProps {
    gstin: string | null;
    pan: string | null;
    period: string;
}

const GstCompanyBar = ({ gstin, pan, period }: GstCompanyBarProps) => {
    const user = useAppSelector(state => state.reducer.user.user);
    // Company GSTIN/PAN come from the user's KYC / company profile.
    const { data: profile } = useCompanyInfoApi({});

    const companyName = user?.companyName?.trim() || '—';
    const gstinValue = profile?.gstNumber?.trim() || gstin;
    const panValue = profile?.panNumber?.trim() || pan;

    return (
        <Flex
            gap={16}
            className="w-full flex-col rounded-[22px] border border-borderStrong bg-surfaceGray px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6 md:py-6"
        >
            <Flex vertical gap={6} className="min-w-0">
                <Title
                    level={4}
                    className="!mb-0 !text-lg !font-semibold !text-ink md:!text-xl break-words"
                >
                    {companyName}
                </Title>
                <Text className="text-sm text-slate-400 md:text-base break-words">
                    GSTIN: {gstinValue || '—'} · PAN: {panValue || '—'}
                </Text>
            </Flex>

            <Flex vertical gap={6} className="min-w-0 md:items-end">
                <Text className="text-sm font-medium text-ink md:text-lg break-words md:text-right">
                    {period}
                </Text>
                <Text className="text-sm text-slate-400 md:text-base break-words md:text-right">
                    {companyInfo.currencyNote}
                </Text>
            </Flex>
        </Flex>
    );
};

export default GstCompanyBar;
