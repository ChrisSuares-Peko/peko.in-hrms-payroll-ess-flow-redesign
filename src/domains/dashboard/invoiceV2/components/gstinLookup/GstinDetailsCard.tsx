import React from 'react';

import {
    CalendarOutlined,
    CheckCircleFilled,
    CheckCircleOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import { Flex, Tag } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { GSTIN_STATUS_STYLES, GSTIN_STATUS_TEXT_COLOR } from '../../constants/gstinLookup';
import { GstinDetails } from '../../types/gstinLookup';

interface Props {
    details: GstinDetails;
}

const Field: React.FC<{
    icon: React.ReactNode;
    label: string;
    value?: string;
    children?: React.ReactNode;
}> = ({ icon, label, value, children }) => (
    <Flex gap={6} align="flex-start">
        <Flex
            align="center"
            justify="center"
            className="w-4 h-4 mt-0.5 text-[#6B7280] flex-shrink-0"
        >
            {icon}
        </Flex>
        <Flex vertical gap={2}>
            <TypographyText className="text-[#6B7280] text-xs font-normal">{label}</TypographyText>
            {children ?? <TypographyText className="text-sm font-semibold">{value || 'N/A'}</TypographyText>}
        </Flex>
    </Flex>
);

const GstinDetailsCard: React.FC<Props> = ({ details }) => (
    <Flex vertical gap={20} className="w-full p-5 md:p-6 rounded-2xl border">
        {/* Header */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
            <Flex align="center" gap={6}>
                <CheckCircleFilled className="text-[#43B75D] text-lg" />
                <TypographyText className="text-lg font-semibold">GSTIN Verified</TypographyText>
            </Flex>
            {/* <Button
                icon={<ReloadOutlined />}
                onClick={onSync}
                className="h-9 px-3 rounded-lg border-[#D1D5DB] text-[#374151] text-sm font-medium"
            >
                Sync Details
            </Button> */}
        </Flex>

        {/* GSTIN row */}
        <Flex
            align="center"
            justify="space-between"
            className="px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#E4E4E7]"
        >
            <Flex vertical gap={1}>
                <TypographyText className="text-[#475467] text-xs font-normal">
                    GSTIN
                </TypographyText>
                <TypographyText className="text-sm md:text-base font-semibold tracking-wide">
                    {details.gstin}
                </TypographyText>
            </Flex>
            <TypographyText
                className={`text-sm font-semibold ${GSTIN_STATUS_TEXT_COLOR[details.status]}`}
            >
                {details.status}
            </TypographyText>
        </Flex>

        {/* Fields — 2 columns */}
        <Flex gap={20} className="w-full flex-col md:flex-row">
            <Flex vertical gap={16} className="flex-1 min-w-0">
                <Field
                    icon={<CheckCircleOutlined />}
                    label="Legal Name"
                    value={details.legalName}
                />
                <Field
                    icon={<CheckCircleOutlined />}
                    label="State Name"
                    value={details.stateName}
                />
                <Field icon={<CheckCircleOutlined />} label="GST Status">
                    <Tag
                        className={`text-xs font-normal rounded-full px-2 py-0.5 m-0 border-0 w-fit ${GSTIN_STATUS_STYLES[details.status]}`}
                    >
                        {details.status}
                    </Tag>
                </Field>
                <Field
                    icon={<EnvironmentOutlined />}
                    label="Registered Address"
                    value={details.registeredAddress}
                />
            </Flex>
            <Flex vertical gap={16} className="flex-1 min-w-0">
                <Field
                    icon={<CheckCircleOutlined />}
                    label="Trade Name"
                    value={details.tradeName}
                />
                <Field
                    icon={<CheckCircleOutlined />}
                    label="Registration Type"
                    value={details.registrationType}
                />
                <Field
                    icon={<CalendarOutlined />}
                    label="Registration Date"
                    value={details.registrationDate}
                />
            </Flex>
        </Flex>
    </Flex>
);

export default GstinDetailsCard;
