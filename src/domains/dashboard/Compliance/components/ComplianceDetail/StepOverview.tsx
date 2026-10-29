import { Button, Flex, Typography } from 'antd';

import iconInfoCircle from '../../assets/icons/icon-info-circle.svg';
import { ComplianceHealthItem } from '../../utils/data';

const { Text } = Typography;

interface StepOverviewProps {
    item: ComplianceHealthItem;
    onBack: () => void;
    onContinue: () => void;
}

export default function StepOverview({ item, onBack, onContinue }: StepOverviewProps) {
    const whatIsThis = item.whatIsThis ?? item.description;
    const whyRequired =
        item.whyRequired ??
        'Mandatory compliance under applicable Indian law. Ensure timely filing to avoid penalties.';

    return (
        <>
            <Flex vertical gap={16} className="w-full">
                <Flex vertical gap={12} className="bg-[#f8fafc] rounded-[24px] p-4 sm:p-7">
                    <Text className="!text-[16px] sm:!text-[20px] !font-semibold !leading-[28px] !text-[#101828] block">
                        What is this compliance?
                    </Text>
                    <Text className="!text-[14px] sm:!text-[16px] !font-normal !leading-[24px] !text-[#475569] block">
                        {whatIsThis}
                    </Text>
                </Flex>

                <Flex vertical gap={12} className="bg-[#f8fafc] rounded-[24px] p-4 sm:p-7">
                    <Text className="!text-[16px] sm:!text-[20px] !font-semibold !leading-[28px] !text-[#101828] block">
                        Why is it required?
                    </Text>
                    <Text className="!text-[14px] sm:!text-[16px] !font-normal !leading-[24px] !text-[#475569] block">
                        {whyRequired}
                    </Text>
                </Flex>

                {item.penalty && (
                    <Flex vertical gap={12} className="bg-[#fcf3f3] rounded-[24px] p-4 sm:p-7">
                        <Flex align="center" gap={8}>
                            <img src={iconInfoCircle} alt="" width={24} height={24} className="shrink-0" />
                            <Text className="!text-[16px] sm:!text-[20px] !font-semibold !leading-[28px] !text-[#101828]">
                                Penalty if missed
                            </Text>
                        </Flex>
                        <Text className="!text-[14px] sm:!text-[16px] !font-normal !leading-[24px] !text-[#1e293b] block">
                            {item.penalty}
                        </Text>
                    </Flex>
                )}
            </Flex>

            <Flex justify="flex-end" gap={10}>
                <Button
                    onClick={onBack}
                    className="!h-10 !w-[118px] !rounded-lg !border-[#ff4f4f] !text-[#ff4f4f] !font-medium !text-[15px]"
                >
                    Back
                </Button>
                <Button
                    type="primary"
                    onClick={onContinue}
                    className="!h-10 !w-[154px] !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-[15px]"
                >
                    Continue
                </Button>
            </Flex>
        </>
    );
}
