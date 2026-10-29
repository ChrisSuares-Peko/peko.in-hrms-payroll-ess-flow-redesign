import React from 'react';

import { Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

interface IconCardProps {
    icon: any;
    title: string;
    onClick?: () => void;
    url?: string;
}

// These 3 tiles share this one component/click handler, so their Moengage events are
// keyed off the tile title rather than each having their own onClick wired in from HomePage.
const TILE_CLICK_EVENT_MAP: Record<string, string> = {
    'Recharge FASTag': 'FASTag_clicked',
    'Traffic Challans': 'traffic_challan_clicked',
    'Manage Subscription': 'manage_subscription_clicked',
};

const TurboIconCard: React.FC<IconCardProps> = ({ icon, title, onClick, url }) => {
    const navigate = useNavigate();
    return (
        <Flex
            vertical
            onClick={() => {
                const trackEvent = TILE_CLICK_EVENT_MAP[title];
                if (trackEvent && typeof Moengage?.track_event === 'function') {
                    Moengage.track_event(trackEvent);
                }
                if (url) navigate(url);
            }}
            gap={12}
            align="center"
            justify="center"
            className="h-30 w-full max-w-36 cursor-pointer sm:h-30 transition duration-300 transform hover:scale-110"
        >
            <Flex
                className="w-full xs:h-24 sm:h-28 md:h-24 bg-[#F9F6F5] rounded-xl sm:rounded-2xl cursor-pointer"
                align="center"
                justify="center"
            >
                <ReactSVG
                    src={icon}
                    beforeInjection={svg => {
                        svg.setAttribute('width', '56');
                        svg.setAttribute('height', '56');
                    }}
                />
            </Flex>

            <Typography.Text
                // style={{ display: 'inline-block' }}
                className=" xs:text-sm cursor-pointer text-center block min-h-10"
            >
                {title}
            </Typography.Text>
        </Flex>
    );
};

export default React.memo(TurboIconCard);
