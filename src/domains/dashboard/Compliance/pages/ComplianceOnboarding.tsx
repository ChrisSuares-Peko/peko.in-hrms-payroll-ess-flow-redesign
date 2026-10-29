import type { FC } from 'react';
import { useState } from 'react';

import { Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import arrowRight from '../assets/icons/arrowRight.svg';
import notIncorporatedIcon from '../assets/icons/notIncorporatedIcon.svg';
import yesIncorporatedIcon from '../assets/icons/yesIncorporatedIcon.svg';

const { Title, Text } = Typography;

interface OptionCardProps {
    icon: string;
    title: string;
    subtitle: string;
    selected?: boolean;
    onClick?: () => void;
}

const OptionCard: FC<OptionCardProps> = ({ icon, title, subtitle, selected, onClick }) => (
    <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        className={[
            'cursor-pointer w-full flex items-center justify-between',
            'pl-3.5 pr-8 py-3 rounded-[32px]',
            'shadow-[0px_1.558px_7.79px_rgba(97,97,97,0.14)]',
            'bg-white transition-shadow hover:shadow-[0px_4px_16px_rgba(97,97,97,0.18)]',
            selected ? 'border border-[#ff4f4f]' : 'border-[0.5px] border-[#ececec]',
        ].join(' ')}
    >
        <Flex align="center" gap={25}>
            <Flex
                align="center"
                justify="center"
                className="w-[130px] h-[130px] rounded-[28px] bg-[#f9f7f3] flex-shrink-0"
            >
                <img src={icon} alt={title} className="w-[74px] h-[74px] object-contain shadow-sm" />
            </Flex>
            <Flex vertical gap={6}>
                <Text className="!text-[#242424] !font-semibold !text-2xl !leading-8">{title}</Text>
                <Text className="!text-black !text-base !leading-6">{subtitle}</Text>
            </Flex>
        </Flex>
        <img src={arrowRight} alt="arrow-right" className="flex-shrink-0 size-[40px]" />
    </div>
);

const ComplianceOnboarding: FC = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState<'yes' | 'no' | null>(null);

    const handleYes = () => {
        setSelected('yes');
        navigate(`${paths.dashboard.compliance}/${paths.compliance.companyIdentify}`);
    };

    const handleNo = () => {
        setSelected('no');
        navigate(`${paths.dashboard.compliance}/${paths.compliance.incorporation}`);
    };

    return (
        <Content>
            <Flex justify="center" className="min-h-[calc(100vh-120px)] py-12">
                <Flex vertical align="center" className="w-full max-w-[686px]" gap={40}>
                    <Flex vertical align="center" gap={16} className="text-center">
                        <Title
                            level={2}
                            className="!mb-0 !text-[#383838] !font-bold"
                            style={{ fontSize: 40, lineHeight: 1.44 }}
                        >
                            Company Compliance &amp; Post-Incorporation Setup
                        </Title>
                        <Text
                            className="!text-[rgba(56,56,56,0.75)]"
                            style={{ fontSize: 20, lineHeight: 1.6 }}
                        >
                            Let&apos;s ensure your company stays compliant with all statutory
                            requirements
                        </Text>
                    </Flex>

                    <Flex vertical className="w-full" gap={37}>
                        <Text className="!font-medium !text-black text-center" style={{ fontSize: 19 }}>
                            Is your company already incorporated in India?
                        </Text>

                        <Flex vertical gap={37}>
                            <OptionCard
                                icon={yesIncorporatedIcon}
                                title="Yes, already incorporated"
                                subtitle="Continue to compliance service"
                                selected={selected === 'yes'}
                                onClick={handleYes}
                            />
                            <OptionCard
                                icon={notIncorporatedIcon}
                                title="No, not incorporated yet"
                                subtitle="Get help with business registration first"
                                selected={selected === 'no'}
                                onClick={handleNo}
                            />
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Content>
    );
};

export default ComplianceOnboarding;
