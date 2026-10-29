import { Flex, Typography } from 'antd';

import iconInfoCircleAmber from '../../assets/icons/icon-info-circle-amber.svg';
import { STATUS_LABEL } from '../../utils/complianceDetail';
import { ComplianceHealthItem } from '../../utils/data';

const { Text, Title } = Typography;

interface ComplianceDetailHeaderProps {
    item: ComplianceHealthItem;
    hideAlert?: boolean;
}

export default function ComplianceDetailHeader({ item, hideAlert }: ComplianceDetailHeaderProps) {
    const status = STATUS_LABEL[item.statusType];

    return (
        <Flex vertical gap={12} align="center" className="w-full">
            <Title
                level={3}
                className="!text-[24px] !font-medium !leading-[1.2] !text-black !m-0 !text-center"
            >
                {item.title}
            </Title>

            <Flex align="center" gap={8} wrap="wrap" justify="center">
                <Text className="!text-[14px] !text-[#8b8b8b] !leading-[22px]">{item.organization}</Text>
                <span className="size-[4px] rounded-full bg-[#8b8b8b] inline-block shrink-0" />
                <Text className="!text-[14px] !text-[#8b8b8b] !leading-[22px]">Due: {item.due}</Text>
                {item.statusType !== 'completed' && (
                    <>
                        <span className="size-[4px] rounded-full bg-[#8b8b8b] inline-block shrink-0" />
                        <Text className="!text-[14px] !leading-[22px]" style={{ color: status?.color }}>
                            {status?.text}
                        </Text>
                    </>
                )}
            </Flex>

            {!hideAlert && ( item.statusType === 'overdue') && (
                <Flex
                    align="center"
                    gap={8}
                    className="bg-[#fffbeb] border border-[#fff2db] rounded-[40px] px-3 py-1"
                >
                    <img src={iconInfoCircleAmber} alt="" width={16} height={16} className="shrink-0" />
                    <Text className="!text-[12px] !text-[#f59e0b] !leading-[22px]">
                        {item.statusType === 'overdue'
                            ? 'This compliance is overdue. Take immediate action to avoid penalties.'
                            : 'This compliance is due soon. Please complete it before the deadline.'}
                    </Text>
                </Flex>
            )}
        </Flex>
    );
}
