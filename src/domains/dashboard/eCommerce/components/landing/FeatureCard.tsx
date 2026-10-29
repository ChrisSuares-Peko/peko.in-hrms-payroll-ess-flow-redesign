import { Flex, Image, Typography } from 'antd';

type FeatureCardProps = {
    title: string;
    description: string;
    image: string;
};

const FeatureCard = ({ title, description, image }: FeatureCardProps) => (
    <Flex
        vertical
        gap={8}
        className="bg-[#FFF9F9] rounded-3xl p-5 aspect-[273/252] overflow-hidden"
    >
        <Typography.Text className="text-lg xl:text-xl font-medium text-black">
            {title}
        </Typography.Text>
        <Typography.Text className="text-sm text-black leading-snug">{description}</Typography.Text>
        <Flex justify="end" align="center" className="h-full w-full">
            <Image src={image} alt={title} className="" preview={false} />
        </Flex>
    </Flex>
);

export default FeatureCard;
