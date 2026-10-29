import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

type StepCardProps = {
    title: string;
    description: string;
    iconSrc?: string;
};

const StepCard = ({ title, description, iconSrc }: StepCardProps) => (
    <Flex
        vertical
        gap={10}
        className="rounded-2xl border border-borderPrimaryLight bg-white p-5 h-full shadow-sm"
    >
        <div className="w-7 h-7 text-lightRed">
            <ReactSVG src={iconSrc ?? ''} />
        </div>
        <Typography.Text className="text-base font-bold text-black">{title}</Typography.Text>
        <Typography.Text className="text-sm text-gray-500 leading-snug">
            {description}
        </Typography.Text>
    </Flex>
);

export default StepCard;
