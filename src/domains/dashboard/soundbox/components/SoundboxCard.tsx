import React from 'react';

import { Card, Flex, Image, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { CardProps } from '@domains/dashboard/soundbox/types/types';

import PaytmSubImage from '../assets/icons/image 85.png';
import PaytmImage from '../assets/icons/image 88.png';

const SoundboxCard: React.FC<CardProps> = ({ id, image, subImage, description }) => (
    <Card bordered>
        <Link to="details">
            <Flex vertical gap={10} align="center">
                <Flex
                    className={` w-24 sm:w-[6.75rem] sm:h-28  h-28 rounded-2xl sm:rounded-3xl `}
                    align="center"
                    justify="center"
                >
                    <Image preview={false} src={PaytmImage} />
                </Flex>

                <Flex justify="start">
                    <Image preview={false} src={PaytmSubImage} />
                </Flex>
                <Typography.Text className="text-[.6rem] text-center  text-textGray">
                    {description}
                </Typography.Text>
            </Flex>
        </Link>
    </Card>
);

export default SoundboxCard;
