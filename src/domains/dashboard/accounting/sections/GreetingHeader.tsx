import type { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

import useCompanyInfoApi from '@domains/dashboard/profile/hooks/useCompanyInfoApi';
import { useAppSelector } from '@src/hooks/store';

import { getCurrentFinancialYear, getGreeting } from '../utils/greeting';

const { Title, Text } = Typography;

const INVALID_NAMES = ['null', 'undefined'];

const GreetingHeader = () => {
    const user = useAppSelector(state => state.reducer.user.user);
    const { data: companyInfo } = useCompanyInfoApi({});

    const rawName = user?.contactPersonName?.trim();
    const firstName =
        rawName && !INVALID_NAMES.includes(rawName.toLowerCase()) ? rawName.split(' ')[0] : 'there';
    const companyName = user?.companyName?.trim();
    const gstin = companyInfo?.gstNumber;

    type MetaSegment = { key: string; node: ReactNode } | null;

    const metaSegments: MetaSegment[] = [
        companyName ? { key: 'company', node: companyName } : null,
        gstin ? { key: 'gstin', node: `GSTIN ${gstin}` } : null,
        { key: 'fy', node: getCurrentFinancialYear() },
    ];
    const visibleSegments = metaSegments.filter(
        (segment): segment is Exclude<MetaSegment, null> => segment !== null
    );

    return (
        <Flex vertical gap={2}>
            <Title level={3} className="!mb-0 !text-lg !font-semibold !text-slate-900 md:!text-xl">
                {`${getGreeting()}, ${firstName}`}
            </Title>
            <Flex
                align="center"
                wrap="wrap"
                gap={8}
                className="text-sm text-slate-400 md:text-base"
            >
                {visibleSegments.map((segment, index) => (
                    <Flex key={segment.key} align="center" gap={8}>
                        {index > 0 && <Text className="text-slate-400">·</Text>}
                        {segment.node}
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
};

export default GreetingHeader;
