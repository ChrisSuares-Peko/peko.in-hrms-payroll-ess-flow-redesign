import { Col, Flex, Row, Typography } from 'antd';

import { ComplianceCard } from './ComplianceCard';
import { SectionIcon } from './TabIcons';
import { type ComplianceHealthItem } from '../../utils/data';

const { Text } = Typography;

interface SectionGroupProps {
    sectionKey: string;
    label: string;
    iconType: 'percentage' | 'building' | 'briefcase';
    items: ComplianceHealthItem[];
    renderCard?: (item: ComplianceHealthItem) => React.ReactNode;
}

export function SectionGroup({ sectionKey: _sectionKey, label, iconType, items, renderCard }: SectionGroupProps) {
    const complianceCount = items.length;
    const pendingCount = items.filter((i) => i.statusType !== 'completed').length;

    return (
        <div className="border-[0.5px] border-[#eaeaea] rounded-[24px] sm:rounded-[32px] overflow-hidden px-4 sm:px-8 pt-5 sm:pt-8 pb-5 sm:pb-8 flex flex-col">
            <Flex align="center" justify="space-between" wrap="wrap" gap={10} className="pb-5 sm:pb-8">
                <Flex align="center" gap={12}>
                    <Flex
                        align="center"
                        justify="center"
                        className="bg-[#fff4f4] rounded-[10px] shrink-0"
                        style={{ width: 37, height: 37, padding: '7px 6px 7px 7px' }}
                    >
                        <SectionIcon type={iconType} />
                    </Flex>
                    <Text className="!text-[#4a5565] !text-[13px] sm:!text-[16px] !font-medium uppercase tracking-wide">
                        {label}
                    </Text>
                </Flex>
                <Flex align="center" gap={6} wrap="wrap">
                    <Flex
                        align="center"
                        gap={8}
                        className="bg-[#f1f3f8] border border-[rgba(37,99,235,0.2)] rounded-[60px] pl-2 pr-1 py-0.5 sm:py-1"
                    >
                        <Text className="!text-[#2563eb] !text-[12px] sm:!text-[16px] !font-normal leading-5 sm:leading-6">Compliances</Text>
                        <Flex
                            align="center"
                            justify="center"
                            className="bg-[#2563eb] rounded-[100px]"
                            style={{ minWidth: 20, height: 20 }}
                        >
                            <Text className="!text-white !text-[12px] sm:!text-[14px] !font-medium text-center px-1">{complianceCount}</Text>
                        </Flex>
                    </Flex>
                    {pendingCount > 0 && (
                        <Flex
                            align="center"
                            gap={4}
                            className="bg-[#fffbeb] border border-[rgba(245,158,11,0.2)] rounded-[60px] pl-2 pr-1 py-0.5 sm:py-1"
                        >
                            <Text className="!text-[#f59e0b] !text-[12px] sm:!text-[16px] !font-normal leading-5 sm:leading-6">Pending</Text>
                            <Flex
                                align="center"
                                justify="center"
                                className="bg-[#f59e0b] rounded-[100px]"
                                style={{ minWidth: 20, height: 20 }}
                            >
                                <Text className="!text-white !text-[12px] sm:!text-[14px] !font-medium text-center px-1">{pendingCount}</Text>
                            </Flex>
                        </Flex>
                    )}
                </Flex>
            </Flex>

            <div className="h-px bg-[#e5e7eb] -mx-4 sm:-mx-8" />

            <div className="pt-6 sm:pt-12">
                <Row gutter={[24, 24]}>
                    {items.map((item) => (
                        <Col xs={24} lg={12} key={item.id} className="!flex">
                            <div className="w-full h-full">
                                {renderCard ? renderCard(item) : <ComplianceCard item={item} />}
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}
