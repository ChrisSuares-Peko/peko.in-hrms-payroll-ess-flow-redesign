import { Flex, Image, Typography } from 'antd';

type FeatureCardProps = {
    title: string;
    description: string;
    image: string;
};

const FeatureCard = ({ title, description, image }: FeatureCardProps) => (
    <Flex
        vertical
        gap={6}
        className="bg-[#FAF6F6] rounded-[20px] p-5 h-full min-h-[200px] overflow-hidden"
    >
        <Typography.Text className="text-lg xl:text-xl font-medium text-black">
            {title}
        </Typography.Text>
        <Typography.Text className="text-sm text-black leading-snug">{description}</Typography.Text>
        <Flex justify="center" align="end" className="h-full w-full pt-2">
            <Image
                src={image}
                alt={title}
                preview={false}
                className="max-h-[120px] object-contain"
            />
        </Flex>
    </Flex>
);

export default FeatureCard;
