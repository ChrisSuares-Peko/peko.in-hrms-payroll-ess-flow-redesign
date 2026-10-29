import React from 'react';

import { Flex, Typography } from 'antd';

import connectIcon from '@src/domains/dashboard/Airline/assets/icons/connect.svg';
import docIcon from '@src/domains/dashboard/Airline/assets/icons/doc-icon.svg';

const PEKO_SUPPORT_NUMBER = '022 489 30373';

type InfoCardProps = {
    icon: React.ReactNode;
    title: string;
    subtitle: React.ReactNode;
};

const SidebarInfoCard = ({ icon, title, subtitle }: InfoCardProps) => (
    <Flex
        align="center"
        gap={12}
        className="w-full p-4 bg-white rounded-xl border border-solid border-slate-200"
    >
        <Flex
            align="center"
            justify="center"
            className="size-10 shrink-0 rounded-[20px] bg-slate-100"
        >
            {icon}
        </Flex>
        <Flex vertical gap={8} className="flex-1 min-w-0">
            <Typography.Text className="text-sm font-semibold text-slate-900">
                {title}
            </Typography.Text>
            <Typography.Text className="text-xs text-slate-500">{subtitle}</Typography.Text>
        </Flex>
    </Flex>
);

type Props = {
    isRefundable: boolean;
};

const FareRulesCard = ({ isRefundable }: Props) => (
    <Flex vertical gap={14} className="w-full">
        <SidebarInfoCard
            icon={<img src={docIcon} alt="" />}
            title="Fare Rules"
            subtitle={isRefundable ? 'Refundable' : 'Non-refundable'}
        />
        <SidebarInfoCard
            icon={<img src={connectIcon} alt="" />}
            title="Need Help with Booking?"
            subtitle={`Dedicated support: ${PEKO_SUPPORT_NUMBER}`}
        />
    </Flex>
);

export default FareRulesCard;
