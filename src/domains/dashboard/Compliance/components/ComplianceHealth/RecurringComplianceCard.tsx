import { Divider, Flex, Image, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { cardConfig, statusBadgeConfig } from './config';
import iconArrowRightRed from '../../assets/icons/icon-arrow-right-red.svg';
import { type ComplianceHealthItem } from '../../utils/data';

const { Text } = Typography;

export function RecurringComplianceCard({ item }: { item: ComplianceHealthItem }) {
    const navigate = useNavigate();
    const card = cardConfig[item.cardType];
    const status = statusBadgeConfig[item.statusType];


    const handleViewDetails = () => {
        navigate(`${paths.dashboard.compliance}/${paths.compliance.detail.replace(':id', item.id)}`);
    };

    return (
        <Flex
            vertical
            className="bg-white border-[#eaeaea] border-[0.5px] drop-shadow-[0px_4px_10px_rgba(0,0,0,0.05)] rounded-[24px] h-full pt-3 pb-6 px-3"
        >
            <Flex
                align="center"
                justify="space-between"
                gap={12}
                className="px-4 lg:px-6 py-4 rounded-[16px] !items-start lg:!items-center"
                style={{ background: card.headerBg }}
            >
                <Flex align="flex-start" gap={10} className="min-w-0 flex-1">
                    <div
                        className="flex items-center justify-center rounded-[27px] shrink-0 size-10 lg:size-[54px] border mt-0.5"
                        style={{ background: card.iconBg, borderColor: card.iconBorder }}
                    >
                        <Image src={card.icon} alt="" width={20} height={20} preview={false} className="object-contain" />
                    </div>
                    <Flex vertical gap={8} className="min-w-0 flex-1">
                        {/* Title row */}
                        <Flex align="center" gap={8} className="min-w-0 flex-1">
                            <Text className="!text-[14px] lg:!text-[20px] !font-semibold !leading-[22px] lg:!leading-[28px] !text-[#2f2b2a] min-w-0 !block truncate">
                                {item.title}
                            </Text>
                            {item.isHighPriority && (
                                <Text className="hidden lg:inline-flex !bg-[#fef2f2] !border !border-[rgba(239,68,68,0.2)] !text-[#ef4444] !text-[12px] !font-normal !leading-[18px] !px-2 !py-1 !rounded-[100px] shrink-0">
                                    High Priority
                                </Text>
                            )}
                        </Flex>
                        {/* Org + frequency — lg+ only */}
                        <Flex align="center" gap={5} className="hidden lg:flex">
                            <div className="border-[0.5px] border-[rgba(0,0,0,0.1)] px-2 py-1 rounded-lg shrink-0" style={{ background: 'rgba(255,255,255,0.6)' }}>
                                <Text className="!text-[14px] !font-normal !text-[#616161]">{item.organization}</Text>
                            </div>
                            {item.frequency && (
                                <>
                                    <div className="size-[5px] rounded-full bg-[#c4c4c4] shrink-0" />
                                    <Text className="!text-[14px] !font-normal !text-[#616161]">{item.frequency}</Text>
                                </>
                            )}
                        </Flex>
                        {/* Mobile-only metadata: two rows */}
                        <Flex vertical gap={4} className="lg:hidden">
                            {/* Row 1: status badge + high priority */}
                            <Flex align="center" gap={4}>
                                <div
                                    className="text-[11px] font-normal leading-[18px] px-2 py-[2px] rounded-lg border shrink-0 whitespace-nowrap"
                                    style={{ background: status.bg, borderColor: status.border, color: status.text }}
                                >
                                    {item.daysLeft}
                                </div>
                                {item.isHighPriority && (
                                    <Text className="!bg-[#fef2f2] !border !border-[#ef4444] !text-[#ef4444] !text-[11px] !font-normal !leading-[18px] !px-2 !py-[2px] !rounded-[100px] shrink-0">
                                        High Priority
                                    </Text>
                                )}
                            </Flex>
                            {/* Row 2: org + frequency */}
                            <Flex align="center" gap={4} className="min-w-0">
                                <div className="border-[0.5px] border-[rgba(0,0,0,0.1)] px-2 py-[2px] rounded-lg flex-1 min-w-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
                                    <Text className="!text-[11px] !font-normal !text-[#616161] truncate !block">{item.organization}</Text>
                                </div>
                                {item.frequency && (
                                    <>
                                        <div className="size-[5px] rounded-full bg-[#c4c4c4] shrink-0" />
                                        <Text className="!text-[11px] !font-normal !text-[#616161] shrink-0">{item.frequency}</Text>
                                    </>
                                )}
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
                {/* Status badge — lg+ only */}
                <div
                    className="hidden lg:flex items-center justify-center text-[14px] font-normal leading-[22px] px-3 py-1.5 rounded-lg border shrink-0 whitespace-nowrap min-w-[101px]"
                    style={{ background: status.bg, borderColor: status.border, color: status.text }}
                >
                    {item.daysLeft}
                </div>
            </Flex>

            <Flex vertical gap={16} className="flex-1 pt-5 min-w-0">
                <Text className="!text-[13px] lg:!text-[18px] !font-normal !leading-[22px] lg:!leading-[28px] !text-[#1e293b] px-3 lg:px-6 !block truncate">
                    {item.description}
                </Text>

                <div className="flex-1" />

                {item.lastCompleted && (
                    <Flex gap={8} className="px-3 lg:gap-4 lg:px-6">
                        <Flex vertical gap={4} className="flex-1 bg-[#f8f8f8] px-3 py-2 lg:pl-4 lg:py-3 rounded-[14px] min-w-0">
                            <Text className="!text-[11px] lg:!text-[14px] !font-normal !text-[#747e8f] !whitespace-nowrap">
                                Last Completed
                            </Text>
                            <Text className="!text-[13px] lg:!text-[16px] !font-semibold !text-[#101828]">
                                {item.lastCompleted}
                            </Text>
                        </Flex>
                        <Flex vertical gap={4} className="flex-1 bg-[#f8f8f8] px-3 py-2 lg:pl-4 lg:py-3 rounded-[14px] min-w-0">
                            <Text className="!text-[11px] lg:!text-[14px] !font-normal !text-[#747e8f] !whitespace-nowrap">
                                Next Due
                            </Text>
                            <Text className="!text-[13px] lg:!text-[16px] !font-semibold !text-[#101828]">
                                {item.due}
                            </Text>
                        </Flex>
                    </Flex>
                )}

                {item.penalty && (
                    <>
                        <Divider className="!my-0 !border-[#e5e7eb]" />
                        {/* lg+: original side-by-side */}
                        <Flex align="center" justify="space-between" className="hidden lg:flex">
                            <Text className="!text-[14px] !font-normal !leading-[22px] !text-[#475569] !pl-6 min-w-0">
                                <Text className="!font-medium !text-black">Penalty</Text>: {item.penalty}
                            </Text>
                            <Flex align="center" gap={4} className="shrink-0 px-4 cursor-pointer" onClick={handleViewDetails}>
                                <Text className="!text-[16px] !font-normal !text-[#ff4f4f] whitespace-nowrap">View details</Text>
                                <Image src={iconArrowRightRed} alt="" width={16} height={16} preview={false} className="object-contain shrink-0" />
                            </Flex>
                        </Flex>
                        {/* mobile: stacked */}
                        <Flex vertical gap={6} className="lg:hidden px-4">
                            <Text className="!text-[12px] !font-normal !leading-[20px] !text-[#475569]">
                                <Text className="!font-medium !text-black">Penalty</Text>: {item.penalty}
                            </Text>
                            <Flex align="center" gap={4} className="cursor-pointer" onClick={handleViewDetails}>
                                <Text className="!text-[14px] !font-normal !text-[#ff4f4f] whitespace-nowrap">View details</Text>
                                <Image src={iconArrowRightRed} alt="" width={16} height={16} preview={false} className="object-contain shrink-0" />
                            </Flex>
                        </Flex>
                    </>
                )}
            </Flex>
        </Flex>
    );
}
