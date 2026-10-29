import type { FC } from 'react';

import { Flex, Typography, Image } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import back from '@assets/svg/grayBack.svg';
import { paths } from '@src/routes/paths';

interface CancelAndBackProps {
    className?: string;
    url?: string;
    isAddOns?: boolean;
}

const GoBackIcon: FC<CancelAndBackProps> = ({ className, url, isAddOns }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSettingsPage = location.state?.isSettingsPage;

    const handleGoBack = () => {
        if (isSettingsPage) {
            navigate(paths.dashboard.settings, {
                state: { activeTab: '3' },
            });
            return;
        }
        const fullUrl = url ? new URL(url) : null;
        navigate(fullUrl ? `${fullUrl.pathname}${fullUrl.search}` : `/${paths.plans.index}`);
    };

    return (
        <Flex
            className={`${className} cursor-pointer w-fit`}
            align="center"
            gap={6}
            onClick={handleGoBack}
        >
            <Image
                src={back}
                alt="goback"
                preview={false}
                style={{ width: '1.2rem', height: '1.2rem' }}
                className="z-50"
            />
            <Typography.Text className="text-[#4D4D4D]">Go Back</Typography.Text>
        </Flex>
    );
};

export default GoBackIcon;
