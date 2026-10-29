import { Flex, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { financialStatementsHeader } from '../../utils/financialStatementsData';

const { Title, Text } = Typography;

const FinancialStatementsHeader = () => {
    const user = useAppSelector(state => state.reducer.user.user);

    const companyName = user?.companyName?.trim();

    return (
        <Flex gap={16} className="w-full flex-col xl:flex-row xl:items-start xl:justify-between">
            <Flex vertical gap={6} className="min-w-0">
                <Title
                    level={3}
                    className="!mb-0 !text-xl !font-semibold !text-slate-900 md:!text-2xl"
                >
                    {financialStatementsHeader.title}
                </Title>
                <Text className="text-sm text-slate-400 md:text-lg">{companyName}</Text>
            </Flex>
        </Flex>
    );
};

export default FinancialStatementsHeader;
