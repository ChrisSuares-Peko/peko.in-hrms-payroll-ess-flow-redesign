import type { FC } from 'react';

import { Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import truckFastIcon from '../assets/productDetails/truck-fast.svg';

const { Text } = Typography;

/**
 * Per-seller "Estimated delivery by {date}" banner (Figma 2304-27306 cart /
 * 2342-24561 checkout) — shared by CartSellerGroups and OrderReview. Renders
 * nothing when there's no real seller-declared date yet (e.g. the cart hasn't
 * been validated with sellers this session, or this particular seller hasn't
 * declared a TAT) — never a fabricated placeholder.
 */
const DeliveryEstimateBanner: FC<{ expectedDeliveryDate: string | null | undefined }> = ({
    expectedDeliveryDate,
}) => {
    if (!expectedDeliveryDate) return null;

    return (
        <Flex
            align="center"
            gap={8}
            className="w-full rounded-xl border-[0.5px] border-solid border-[#b4e8c2] bg-[#f4fff7] pl-4 pr-3 py-3"
        >
            <img src={truckFastIcon} alt="" className="h-4 w-4 shrink-0" />
            <Text className="text-[14px] text-black">
                Estimated delivery by{' '}
                <span className="font-medium">
                    {dayjs(expectedDeliveryDate).format('dddd, DD MMM')}
                </span>
            </Text>
        </Flex>
    );
};

export default DeliveryEstimateBanner;
