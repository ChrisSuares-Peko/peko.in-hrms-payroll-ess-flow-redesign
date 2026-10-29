import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

import Branding from './Branding';

const { Text, Title } = Typography;

interface Props {
    title: string;
    subtitle?: string;
    // Buttons rendered beside the Droom attribution, right-aligned.
    actions?: ReactNode;
}

// Page header shared by every vehicle-report screen: title + subtitle on the left,
// "Partnered with droom" and any page actions on a single row to the right.
const ReportPageHeader = ({ title, subtitle, actions }: Props) => (
    <Flex className="flex-col justify-between gap-4 md:flex-row md:items-center">
        <Flex vertical gap={4}>
            <Title level={4} className="!mb-0 !text-[#0A0A0A]">
                {title}
            </Title>
            {!!subtitle && <Text className="text-sm text-[#667085]">{subtitle}</Text>}
        </Flex>
        <Flex align="center" gap={20} className="flex-wrap">
            <Branding classes="pointer-events-none" />
            {!!actions && (
                <Flex align="center" gap={10} className="flex-wrap">
                    {actions}
                </Flex>
            )}
        </Flex>
    </Flex>
);

export default ReportPageHeader;
