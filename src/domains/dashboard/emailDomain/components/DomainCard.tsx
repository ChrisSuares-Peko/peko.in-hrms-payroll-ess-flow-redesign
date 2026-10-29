import React from 'react';

import '../assets/style.css';
import { Card, Flex, Image, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import { setSelectedProductId } from '../slices/businessEmailSlice';

const { Text } = Typography;

interface cardProps {
    name: string;
    image: string;
    offersText: string;
    productId: number;
}
const DomainCard = ({ image, name, offersText, productId }: cardProps) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { xs } = useScreenSize();
    return (
        <>
            <Card
                onClick={() => {
                    dispatch(setSelectedProductId(productId));
                    navigate(`/${paths.dashboard.emailDomain}/${name}`, {
                        state: { productId, name },
                    });
                }}
                className="relative transform border rounded-lg cursor-pointer h-48 _scale_on_hover"
                style={{
                    transition: 'transform .3s ease-in-out',
                }}
            >
                <Flex className="justify-center sm:justify-normal">
                    <Tag
                        color="#29BD11"
                        className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 md:max-w-52 xs:max-w-28 overflow-hidden whitespace-nowrap overflow-ellipsis"
                    >
                        {offersText}
                    </Tag>
                </Flex>
                <Flex vertical justify="center" align="center" className="h-full">
                    <Flex
                        className="w-28 sm:w-36 md:w-36 lg:w-28 h-28 sm:h-32 md:h-32 lg:h-32 rounded-2xl sm:rounded-3xl"
                        align="center"
                        justify="center"
                    >
                        <Image
                            preview={false}
                            src={image}
                            alt="No Image"
                            height={xs ? 50 : 70}
                            width={120}
                            className="object-contain"
                        />
                    </Flex>
                </Flex>
            </Card>

            <Text className="md:text-[1rem] text-red-400 mt-2 line-clamp-1 text-center font-normal">
                {name}
            </Text>
            {/* <Text className="md:text-[.75rem] xxl:text-sm mt-2 text-textGrey line-clamp-1">
                {offersText}
            </Text> */}
        </>
    );
};

export default DomainCard;
