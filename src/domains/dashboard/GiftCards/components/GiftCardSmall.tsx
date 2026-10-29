import React from 'react';

import { Flex, Image, Typography } from 'antd';
import { Link } from 'react-router-dom';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import defaultImage from '../assets/images/default.png';
import { setBuyAgain, setResuming } from '../slices/checkoutSlice';

interface GiftCardProps {
    id?: number;
    image?: string;
    name?: string;
    description?: string;
}

// No usageType tag here — on the narrow-screen grid there isn't room for both the
// tag and the full card name, and the name (the more useful of the two on a
// listing page) was losing that fight, truncating to "P…"/"Taco…"/etc.
const GiftCardSmall: React.FC<GiftCardProps> = ({ id, image, name, description }) => {
    useHideWidgetOnDrawer(true);
    const dispatch = useAppDispatch();

    // Deliberately picking a gift card from a listing is always a fresh start —
    // clear the one-shot "resume" flags so any receiver/amount details left over
    // from an earlier, uncompleted visit to this same card don't reappear. Doesn't
    // affect the genuine resume paths (Buy Again, back from the payment page),
    // since neither of those navigates through this tile's click.
    const handleClick = () => {
        dispatch(setResuming(false));
        dispatch(setBuyAgain(false));
    };

    return (
        <Flex className="items-center justify-center my-1 md:justify-start md:items-start" gap={0}>
            <Link
                to={`/${paths.giftcards.index}/${paths.giftcards.details}/${id}`}
                onClick={handleClick}
            >
                <Image preview={false} fallback={defaultImage} src={image} className="rounded-lg" />
                <Flex vertical className="">
                    <Flex align="center" gap={6}>
                        <Typography className="text-sm font-semibold text-neutral-900 line-clamp-1">
                            {name}
                        </Typography>
                    </Flex>
                    {/* <Typography.Text className="text-xs font-normal text-zinc-600 line-clamp-1">
                      {description ? new DOMParser().parseFromString(description, 'text/html').body.textContent?.trim() : ''}
                    </Typography.Text> */}
                </Flex>
            </Link>
        </Flex>
    );
};

export default GiftCardSmall;
