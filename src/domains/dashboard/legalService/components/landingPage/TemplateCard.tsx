import type { ReactNode } from 'react';
import { useState } from 'react';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Flex } from 'antd';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';

import ArrowWhiteIcon from '../../assets/icons/line-arrow-right-white.svg';
import ArrowRedIcon from '../../assets/icons/line-arrow-right.svg';

interface TemplateCardProps {
    title: string;
    description: string;
    timeEstimate: string;
    icon: ReactNode;
    category?: string;
    isFeatured?: boolean;
    onUse?: () => void;
}

const TemplateCard = ({
    title,
    description,
    timeEstimate,
    icon,
    category,
    isFeatured = false,
    onUse,
}: TemplateCardProps) => {
    const [useHovered, setUseHovered] = useState(false);

    return (
        <Card
            variant="borderless"
            className={`flex-1 rounded-3xl cursor-pointer transition-shadow hover:shadow-lg ${
                isFeatured
                    ? 'bg-pink-50 shadow-[0px_2px_13px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-red-500'
                    : 'bg-white shadow-[0px_2px_13px_0px_rgba(0,0,0,0.06)] outline outline-[0.5px] outline-stone-300'
            }`}
            styles={{
                body: {
                    padding: '16px 20px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                },
            }}
        >
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="flex-start">
                    <Flex
                        align="center"
                        justify="center"
                        className="w-14 h-14 rounded-xl bg-white shadow-sm flex-shrink-0"
                    >
                        {icon}
                    </Flex>
                    {category && (
                        <span className="px-1.5 py-0.5 bg-black/5 rounded-lg text-[#FF3A3A] text-xs font-normal font-['Roboto'] leading-4">
                            {category}
                        </span>
                    )}
                </Flex>
                <Flex vertical gap={2}>
                    <TypographyText className="text-gray-900 text-lg font-semibold font-['Roboto'] leading-[26px] block">
                        {title}
                    </TypographyText>
                    <TypographyText className="text-gray-500 text-sm font-normal font-['Roboto'] leading-6 block">
                        {description}
                    </TypographyText>
                </Flex>
            </Flex>

            <Divider className="my-0" />

            <Flex justify="space-between" align="center">
                <Flex align="center" gap={8} className="opacity-80">
                    <ClockCircleOutlined className="text-zinc-800 text-xl" />
                    <TypographyText className="text-gray-800 text-sm font-normal font-['Roboto'] leading-6">
                        {`${timeEstimate.replace(/\s*[-–]\s*/g, ' - ').replace(/(\s*min)+\s*$/i, '')} min`}
                    </TypographyText>
                </Flex>

                {isFeatured ? (
                    <Button
                        onClick={onUse}
                        className="rounded-md !bg-[#FF3A3A] !border-[#FF3A3A] !text-white text-sm font-medium font-['Roboto'] px-4 !h-10 hover:!bg-[#e02020] hover:!border-[#e02020] flex items-center gap-1.5"
                    >
                        Use
                        <ReactSVG
                            src={ArrowWhiteIcon}
                            beforeInjection={svg =>
                                svg.setAttribute(
                                    'style',
                                    'width: 16px; height: 16px; display:flex; align-items:center;'
                                )
                            }
                        />
                    </Button>
                ) : (
                    <Button
                        onClick={onUse}
                        onMouseEnter={() => setUseHovered(true)}
                        onMouseLeave={() => setUseHovered(false)}
                        className="rounded-md !border-[#FF3A3A] !text-[#FF3A3A] bg-white text-sm font-medium font-['Roboto'] px-4 !h-10 hover:!bg-[#FF3A3A] hover:!text-white hover:!border-[#FF3A3A] flex items-center gap-1.5"
                    >
                        Use
                        <ReactSVG
                            src={useHovered ? ArrowWhiteIcon : ArrowRedIcon}
                            beforeInjection={svg =>
                                svg.setAttribute('style', 'width: 16px; height: 16px;')
                            }
                        />
                    </Button>
                )}
            </Flex>
        </Card>
    );
};

export default TemplateCard;
