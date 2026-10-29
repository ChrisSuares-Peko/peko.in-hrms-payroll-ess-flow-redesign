import React from 'react';

import { Flex, Image, Typography } from 'antd';
import { Link } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

const { Text } = Typography;

interface GiftCardProps {
    id?: number;
    image?: string;
    title: string;
    location: string;
    path: string;
}

const DashboardProjectListing: React.FC<GiftCardProps> = ({ id, image, title, location, path }) => {
    const { md, xxl } = useScreenSize();

    return (
        <Flex
            vertical
            className=" items-center justify-center md:justify-start md:items-start rounded-2xl "
        >
            <Link
                className="flex md:justify-start items-start justify-center flex-col w-full"
                to={path}
            >
                <Image
                    loading="lazy"
                    className=" rounded-lg sm:rounded-2xl mb-3 object-cover transition duration-300 transform hover:scale-90 "
                    preview={false}
                    src={image}
                    width="100%"
                    height={xxl ? '12rem' : '10rem'}
                />
                <Flex vertical gap={5} className="ml-1 mt-2">
                    <Text
                        className="md:text-start  md:text-md  font-medium  line-clamp-1"
                        style={{ fontSize: md ? '' : '10px' }}
                    >
                        {title}
                    </Text>
                    <Text
                        className="md:text-start  text-neutral-400 font-normal md:text-xs  line-clamp-1"
                        style={{ fontSize: md ? '' : '6px' }}
                    >
                        {location}
                    </Text>
                </Flex>
            </Link>
        </Flex>
    );
};

export default React.memo(DashboardProjectListing);
