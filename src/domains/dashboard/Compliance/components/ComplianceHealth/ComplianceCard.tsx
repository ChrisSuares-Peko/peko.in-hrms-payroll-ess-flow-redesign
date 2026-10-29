import { Divider, Flex, Image, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { cardConfig, statusBadgeConfig } from './config';
import iconArrowRightRed from '../../assets/icons/icon-arrow-right-red.svg';
import iconCalendarGray from '../../assets/icons/icon-calendar-gray.svg';
import { type ComplianceHealthItem } from '../../utils/data';

const { Text } = Typography;

export function ComplianceCard({ item }: { item: ComplianceHealthItem }) {
    const navigate = useNavigate();
    const isCompleted = item.statusType === 'completed';
    const card = isCompleted ? cardConfig.completed : cardConfig[item.cardType];
    const status = statusBadgeConfig[item.statusType];

    const handleViewDetails = () => {
        navigate(`${paths.dashboard.compliance}/${paths.compliance.detail.replace(':id', item.id)}`);
    };

    return (
        <Flex
            vertical
            className="bg-white border-[#eaeaea] border-[0.5px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.05)] pb-6 pt-3 px-3 rounded-[24px] h-full"
        >
            <Flex
                align="flex-start"
                justify="space-between"
                gap={8}
                className="px-4 lg:px-6 py-4 rounded-2xl mb-6"
                style={{ background: card.headerBg }}
            >
                <Flex align="center" gap={10} className="min-w-0 flex-1">
                    <Flex
                        align="center"
                        justify="center"
                        className="rounded-[27px] shrink-0 size-10 lg:size-[54px] border"
                        style={{ background: card.iconBg, borderColor: card.iconBorder }}
                    >
                        <Image src={card.icon} alt="" width={20} height={20} preview={false} className="object-contain" />
                    </Flex>
                    <Flex vertical gap={8} className="min-w-0 flex-1">
                        {/* Title row */}
                        <Flex align="center" gap={8} className="min-w-0 flex-1">
                            <Text className="!text-[14px] lg:!text-[20px] !font-semibold !leading-[22px] lg:!leading-[28px] !text-[#2f2b2a] min-w-0 !block truncate">
                                {item.title}
                            </Text>
                            {/* High Priority badge — lg+ only */}
                            {item.isHighPriority && (
                                <Text className="hidden lg:inline-flex !bg-[#fef2f2] !border !border-[rgba(239,68,68,0.2)] !text-[#ef4444] !text-[12px] !font-normal !leading-[18px] !px-2 !py-1 !rounded-[100px] shrink-0 whitespace-nowrap">
                                    High Priority
                                </Text>
                            )}
                        </Flex>
                        {/* Org — lg+ only */}
                        {item.statusType === 'completed' ? (
                            <span className="hidden lg:inline text-[#8b8b8b] text-[16px] font-normal leading-[24px]">
                                {item.organization}
                            </span>
                        ) : (
                            <span className="hidden lg:inline-block w-fit bg-[rgba(255,255,255,0.6)] border-[0.5px] border-[rgba(0,0,0,0.15)] text-[#616161] text-[16px] font-normal leading-[24px] px-[8px] py-[4px] rounded-[8px]">
                                {item.organization}
                            </span>
                        )}
                        {/* Mobile-only metadata: two rows */}
                        <Flex vertical gap={4} className="lg:hidden">
                            {/* Row 1: status badge + high priority */}
                            <Flex align="center" gap={4}>
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="px-2 py-[2px] rounded-[8px] border shrink-0"
                                    style={{ background: status.bg, borderColor: status.border }}
                                >
                                    <Text className="!text-[11px] !font-normal !leading-[18px] !whitespace-nowrap" style={{ color: status.text }}>
                                        {item.statusType === 'completed' ? 'Completed' : item.daysLeft}
                                    </Text>
                                </Flex>
                                {item.isHighPriority && (
                                    <Text className="!bg-[#fef2f2] !border !border-[rgba(239,68,68,0.2)] !text-[#ef4444] !text-[11px] !font-normal !leading-[18px] !px-2 !py-[2px] !rounded-[100px] shrink-0 whitespace-nowrap">
                                        High Priority
                                    </Text>
                                )}
                            </Flex>
                            {/* Row 2: org */}
                            {item.statusType === 'completed' ? (
                                <span className="text-[#8b8b8b] text-[11px] font-normal leading-[18px]">
                                    {item.organization}
                                </span>
                            ) : (
                                <span className="inline-block w-fit bg-[rgba(255,255,255,0.6)] border-[0.5px] border-[rgba(0,0,0,0.15)] text-[#616161] text-[11px] font-normal leading-[18px] px-2 py-[2px] rounded-[8px]">
                                    {item.organization}
                                </span>
                            )}
                        </Flex>
                    </Flex>
                </Flex>
                {/* Status badge — lg+ only */}
                <Flex
                    align="center"
                    justify="center"
                    className="hidden lg:flex px-[12px] py-[6px] rounded-[8px] border shrink-0 w-[101px]"
                    style={{ background: status.bg, borderColor: status.border }}
                >
                    <Text className="!text-[14px] !font-normal !leading-[22px] !whitespace-nowrap" style={{ color: status.text }}>
                        {item.statusType === 'completed' ? 'Completed' : item.daysLeft}
                    </Text>
                </Flex>
            </Flex>

            <Flex vertical gap={16} className="flex-1 min-w-0">
                <Flex vertical gap={8} className="px-6 w-full min-w-0">
                    <Text className="!text-[13px] sm:!text-[18px] !font-normal !leading-[22px] sm:!leading-[28px] !text-[#1e293b] font-[Roboto,sans-serif] !block truncate">
                        {item.description}
                    </Text>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1">
                            <img src={iconCalendarGray} alt="" width={16} height={16} className="object-contain shrink-0" />
                            <Text className="!text-[14px] !font-normal !text-[#838383] !whitespace-nowrap" style={{ lineHeight: '16px' }}>
                                Due: {item.due}
                            </Text>
                        </div>
                        {item.frequency && (
                            <>
                                <span className="hidden sm:inline-block w-[5px] h-[5px] rounded-full bg-[#838383] shrink-0" />
                                <Text className="!text-[14px] !font-normal !text-[#838383] !whitespace-nowrap" style={{ lineHeight: '16px' }}>
                                    {item.frequency}
                                </Text>
                            </>
                        )}
                    </div>
                </Flex>

                <div className="flex-1" />

                <Divider className="!my-0 !border-[#e5e7eb]" />
                {/* lg+: original side-by-side layout */}
                <Flex align="center" justify="space-between" className="hidden lg:flex">
                    {item.penalty ? (
                        <Text className="!text-[14px] !font-normal !leading-[22px] !text-[#475569] !pl-6 min-w-0">
                            <Text className="!font-medium !text-black">Penalty</Text>: {item.penalty}
                        </Text>
                    ) : (
                        <span />
                    )}
                    {!isCompleted && (
                        <Flex align="center" gap={4} className="shrink-0 px-4 cursor-pointer" onClick={handleViewDetails}>
                            <Text className="!text-[16px] !font-normal !leading-[24px] !text-[#ff4f4f] whitespace-nowrap">View details</Text>
                            <Image src={iconArrowRightRed} alt="" width={16} height={16} preview={false} className="object-contain shrink-0" />
                        </Flex>
                    )}
                </Flex>
                {/* mobile: stacked layout */}
                <Flex vertical gap={6} className="lg:hidden px-4">
                    {item.penalty && (
                        <Text className="!text-[12px] !font-normal !leading-[20px] !text-[#475569]">
                            <Text className="!font-medium !text-black">Penalty</Text>: {item.penalty}
                        </Text>
                    )}
                    {!isCompleted && (
                        <Flex align="center" gap={4} className="cursor-pointer" onClick={handleViewDetails}>
                            <Text className="!text-[14px] !font-normal !leading-[24px] !text-[#ff4f4f] whitespace-nowrap">View details</Text>
                            <Image src={iconArrowRightRed} alt="" width={16} height={16} preview={false} className="object-contain shrink-0" />
                        </Flex>
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
}
