import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

type UpgradePlanButtonProps = {
    className?: string;
};

const UpgradePlanButton = ({ className = '' }: UpgradePlanButtonProps) => (
    <Link to={paths.dashboard.plans}>
        <Flex
            align="center"
            justify="center"
            gap={3}
            className={`h-10 cursor-pointer whitespace-nowrap rounded-lg border border-solid border-[#FF4F4F] bg-white px-3 shadow-[0px_1.66px_16.56px_1.52px_rgba(0,0,0,0.06)] ${className}`}
        >
            <Typography.Text className="text-sm font-medium leading-none text-[#FF4F4F]">
                Upgrade Plan
            </Typography.Text>
            <svg
                width={24}
                height={24}
                viewBox="0 0 24.9371 24.9371"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12.4338 2.07903C6.69832 2.07903 2.0434 6.73395 2.0434 12.4695C2.0434 18.205 6.69832 22.8599 12.4338 22.8599C18.1694 22.8599 22.8243 18.205 22.8243 12.4695C22.8243 6.73395 18.1798 2.07903 12.4338 2.07903ZM16.3303 12.8331L12.465 17.2283L12.0078 17.7478C11.374 18.4648 10.8545 18.2777 10.8545 17.3114V13.1968H9.08812C8.28806 13.1968 8.06986 12.7085 8.59977 12.1058L12.465 7.71065L12.9222 7.19113C13.556 6.47419 14.0755 6.66122 14.0755 7.62753V11.7421H15.8419C16.642 11.7421 16.8602 12.2305 16.3303 12.8331Z"
                    fill="#FF4F4F"
                />
            </svg>
        </Flex>
    </Link>
);

export default UpgradePlanButton;
