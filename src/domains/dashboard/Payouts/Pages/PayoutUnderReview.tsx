import { Flex, Typography } from 'antd';

import underReviewIcon from '../assets/icons/underReviewIcon.svg';

interface UnderReviewProps {
    activationType?: string;
}

const UnderReview = ({ activationType = 'Payout' }: UnderReviewProps) => (
    <Flex vertical align="center" gap={16} className="w-full pt-16 text-center">
        <div className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-[#FEF9C3]">
            <div className="flex h-[67.5px] w-[67.5px] items-center justify-center rounded-full bg-[#FEF08A]">
                <img src={underReviewIcon} alt="under review" className="h-[45px] w-[45px]" />
            </div>
        </div>

        <Typography.Title level={2} className="!mb-0 !text-[32px] !font-medium !leading-[42px] !text-black">
            {activationType} Activation Under Review
        </Typography.Title>

        <Typography.Text className="w-full text-[20px] leading-[32px] text-[#52525B]">
            Dear Customer, Your {activationType.toLowerCase()} activation request is currently under review. Our team is
            verifying your details, and the account will be activated automatically once the
            review is completed. This process typically takes up to 24 hours.
        </Typography.Text>
    </Flex>
);

export default UnderReview;
