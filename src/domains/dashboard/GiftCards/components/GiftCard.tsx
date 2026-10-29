import React, { useState } from 'react';

import { Flex, Image, Typography, Skeleton } from 'antd';
import Fade from 'react-reveal/Fade';
import { Link } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import UsageTypeTag from './UsageTypeTag';
import defaultImage from '../assets/images/default.png';
import { setBuyAgain, setResuming } from '../slices/checkoutSlice';

interface GiftCardProps {
    id?: number;
    image?: string;
    name?: string;
    description?: string;
    usageType?: string;
    loaded?: boolean;
    animate?: boolean;
}

const GiftCard: React.FC<GiftCardProps> = ({
    id,
    image,
    name,
    description,
    usageType,
    loaded,
    animate = true,
}: GiftCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useAppDispatch();

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    // Deliberately picking a gift card from a listing is always a fresh start —
    // clear the one-shot "resume" flags so any receiver/amount details left over
    // from an earlier, uncompleted visit to this same card don't reappear. Doesn't
    // affect the genuine resume paths (Buy Again, back from the payment page),
    // since neither of those navigates through this tile's click.
    const handleClick = () => {
        dispatch(setResuming(false));
        dispatch(setBuyAgain(false));
    };

    const content = (
        <Flex className="items-center justify-center md:justify-start md:items-start">
            <Link
                to={`/${paths.giftcards.index}/${paths.giftcards.details}/${id}`}
                onClick={handleClick}
            >
                <Flex
                    align="center"
                    className={`w-full min-h-52 rounded-2xl sm:rounded-3xl mb-3 transition-transform ${
                        isHovered ? 'transform scale-105' : ''
                    }`}
                    style={{
                        transition: 'transform .3s ease-in-out',
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <Image
                        preview={false}
                        src={image}
                        fallback={defaultImage}
                        loading="lazy"
                        onLoad={handleImageLoad}
                        onError={
                            // eslint-disable-next-line no-return-assign
                            (e: React.SyntheticEvent<HTMLImageElement>) =>
                                ((e.target as HTMLImageElement).src = defaultImage)
                        }
                        style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            objectFit: 'fill',
                            borderRadius: '0.625rem',
                        }}
                    />

                    {/* {isLoading && loaded && <Skeleton.Avatar active size={200} shape="square" />} */}
                    {image && isLoading && loaded && (
                        <Skeleton.Image
                            active
                            style={{ width: '15rem', aspectRatio: '16/9' }}
                        />
                    )}
                </Flex>

                <Flex align="center" justify="space-between" gap={8}>
                    <Typography.Title
                        level={5}
                        className=" text-neutral-900 text-[1.3rem] font-medium line-clamp-1 h-6"
                    >
                        {name}
                    </Typography.Title>
                    <UsageTypeTag usageType={usageType} />
                </Flex>
                {/* <Typography.Text className="h-4 text-xs font-normal text-zinc-600 line-clamp-1">
                    {description ? new DOMParser().parseFromString(description, 'text/html').body.textContent?.trim() : ''}
                </Typography.Text> */}
            </Link>
        </Flex>
    );

    return animate ? <Fade bottom>{content}</Fade> : content;
};

export default GiftCard;
