import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import {
    formatNumberWithLocalStringWithoutDecimalPoint,
    formatNumberWithoutCommas,
} from '@utils/priceFormat';

type ClaimPekoCreditsButtonProps = {
    amount?: string | number;
    size?: 'default' | 'small';
};

const ClaimPekoCreditsButton = ({ amount = 0, size = 'default' }: ClaimPekoCreditsButtonProps) => {
    const isSmall = size === 'small';
    const hasAmount = Number(formatNumberWithoutCommas(amount)) > 0;

    return (
        <Link to={paths.dashboard.pekoCredit}>
            <Flex
                vertical
                align="center"
                justify="center"
                className={`cursor-pointer shrink-0 whitespace-nowrap rounded-lg border border-dashed border-[#FF4F4F] bg-white shadow-[0px_1.66px_16.56px_1.52px_rgba(0,0,0,0.06)] ${
                    isSmall ? 'h-9 px-2' : 'h-10 px-3'
                }`}
            >
                <Typography.Text
                    className={`leading-tight text-[#FF4F4F] ${
                        // eslint-disable-next-line no-nested-ternary
                        hasAmount ? (isSmall ? 'text-[8px]' : 'text-[9px]') : 'text-xs font-medium'
                    }`}
                >
                    Claim Peko Credits
                </Typography.Text>
                {hasAmount && (
                    <Typography.Text
                        className={`font-medium leading-tight text-[#FF4F4F] ${
                            isSmall ? 'text-xs' : 'text-sm'
                        }`}
                    >
                        ₹ {formatNumberWithLocalStringWithoutDecimalPoint(amount)}
                    </Typography.Text>
                )}
            </Flex>
        </Link>
    );
};

export default ClaimPekoCreditsButton;
