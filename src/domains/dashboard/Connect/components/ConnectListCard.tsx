import React, { useState } from 'react';

import { Flex, Image, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';

import marketPlaceDefaultImage from '@domains/dashboard/Connect/assets/icons/marketPlaceDefaultImage.svg';
import '../assets/style.css';
import useScreenSize from '@src/hooks/useScreenSize';

const { Text } = Typography;
interface ConnectListCardProps {
    id: number;
    title: string;
    image?: string;
    description: string;
    offer?: string;
}

const ConnectListCard = ({ id, image, title, description, offer }: ConnectListCardProps) => {
    const { xs } = useScreenSize();
    const [imageSrc, setImageSrc] = useState(image || marketPlaceDefaultImage);
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setImageSrc(marketPlaceDefaultImage);
    };

    return (
        <Link to={`details/${id}`}>
            <Flex
                vertical
                className="rounded-lg p-3 sm:p-2 sm:min-w-48 sm:min-h-60 border relative _scale_on_hover card-container"
                gap={20}
            >
                {offer && (
                    <Flex className="justify-center sm:justify-normal">
                        <Tag
                            color="#29BD11"
                            className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 md:max-w-52 xs:max-w-28 overflow-hidden whitespace-nowrap overflow-ellipsis"
                        >
                            {offer}
                        </Tag>
                    </Flex>
                )}
                <Flex vertical justify="center" align="center" gap={10}>
                    <Image
                        src={imageSrc}
                        preview={false}
                        alt="logo"
                        height={xs ? 50 : 70}
                        width={120}
                        className="object-contain"
                        loading="lazy"
                        onError={handleImageError}
                    />
                    <Text className="mt-3 text-sm sm:text-xl">{title}</Text>
                    <Text className="text-stone-500 text-sm font-light text-center line-clamp-2 mx-2 ">
                        {description}
                    </Text>
                </Flex>
            </Flex>
        </Link>
    );
};
export default React.memo(ConnectListCard);
