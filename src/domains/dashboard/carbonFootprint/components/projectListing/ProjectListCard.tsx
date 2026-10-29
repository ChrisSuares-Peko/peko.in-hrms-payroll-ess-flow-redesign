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

const ProjectListCard: React.FC<GiftCardProps> = ({ id, image, title, location, path }) => {
    const { md, xxl } = useScreenSize();

    const height = md ? '10rem' : '7rem';
    return (
        <Flex
            vertical
            className=" items-center justify-center md:justify-start md:items-start rounded-2xl xs:bg-slate-100 md:bg-white xs:py-3 xs:px-3"
        >
            <Link className="flex justify-start items-start flex-col w-full" to={path}>
                <Image
                    loading="eager"
                    className=" rounded-lg sm:rounded-2xl mb-3 object-cover transition duration-300 transform hover:scale-90 "
                    preview={false}
                    src={image}
                    width="100%"
                    height={xxl ? '13rem' : height}
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

export default ProjectListCard;
