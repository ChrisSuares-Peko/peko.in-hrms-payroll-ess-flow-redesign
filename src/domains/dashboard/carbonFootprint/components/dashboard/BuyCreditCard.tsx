import { Button, Flex, Image, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import buyCreditIcon from '@domains/dashboard/carbonFootprint/assets/images/buyCreditIcon.png';
import { paths } from '@src/routes/paths';

const { Text } = Typography;

const BuyCreditCard = () => {
    const navigate = useNavigate();
    return (
        <Flex
            vertical
            justify="center"
            align="center"
            gap={20}
            className="h-full bg-stone-50 rounded-2xl py-10 lg:py-0 px-3"
        >
            <Text className=" text-center text-black text-3xl font-light">
                Buy Carbon Credits Now
            </Text>
            <Flex>
                <Image loading="lazy" src={buyCreditIcon} preview={false} />
            </Flex>
            <Button
                danger
                onClick={() =>
                    navigate(`/${paths.zeroCarbon.index}/${paths.zeroCarbon.buyCredits}`)
                }
                className="px-10"
            >
                Buy Now
            </Button>
        </Flex>
    );
};

export default BuyCreditCard;
