import { Flex, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

import AirlineBanner from './AirlineBanner';
import DynamicBanner from './DynamicBanner';
import useBannersApi from '../../hooks/useBannersApi';

const Headers = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useBannersApi('TOP');

    const handleButtonClick = () => {
        const bannerLink = data?.[0]?.bannerLink;
        if (!bannerLink || typeof bannerLink !== 'string') return;
        try {
            const fullUrl = new URL(bannerLink, window.location.origin);
            const target = `${fullUrl.pathname}${fullUrl.search}${fullUrl.hash}`;

            if (fullUrl.hostname === window.location.hostname) {
                navigate(target);
            } else {
                window.location.href = fullUrl.toString();
            }
        } catch (err) {
            console.error('Invalid banner link:', bannerLink, err);
        }
    };

    if (isLoading) {
        return (
            <Flex
                className="px-4 py-4 mb-5 sm:px-10 sm:py-7 banner-gradient rounded-2xl"
                justify="space-between"
                align="center"
            >
                <Skeleton active />
            </Flex>
        );
    }
    if (!data || data.length === 0) return null;

    if (data?.[0]?.bannerLink?.includes('corporate-travel')) {
        return <AirlineBanner data={data} handleButtonClick={handleButtonClick} />;
    }
    return <DynamicBanner data={data} handleButtonClick={handleButtonClick} />;
};

export default Headers;
