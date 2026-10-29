import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

type SupportCardProps = {
    title: string;
    iconSrc: string;
};

const SupportCard = ({ title, iconSrc }: SupportCardProps) => (
    <Flex
        vertical
        gap={12}
        justify="center"
        className="rounded-[20px] border border-[#E8E8E8] bg-white px-5 py-4 h-full min-h-[100px]"
    >
        <div className="h-6 text-lightRed">
            <ReactSVG src={iconSrc} />
        </div>
        <Typography.Text className="text-base font-bold text-[#3D3D3D]">{title}</Typography.Text>
    </Flex>
);

export default SupportCard;
