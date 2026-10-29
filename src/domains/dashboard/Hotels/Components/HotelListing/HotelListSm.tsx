import { useState } from 'react';

import { Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';
// import { Link, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import close from '@domains/dashboard/Hotels/Assets/icons/Close.svg';
import HotelListAdaptive from '@domains/dashboard/Hotels/Components/HotelListing/HotelListAdaptive';

import { Hotels } from '../../types/types';

interface hotelsProps {
    isLoading: boolean;
    originaldata: Hotels[];
    conversationId: string;
    searchKey: string;
}
const HotelListSm = ({ isLoading, originaldata, conversationId, searchKey }: hotelsProps) => {
    const [visible, setVisible] = useState(false);

    const openWindow = () => {
        setVisible(true);
    };

    const closeWindow = () => {
        setVisible(false);
    };

    return (
        <Content>
            {visible ? (
                <>
                    <Flex gap="large">
                        <ReactSVG src={close} onClick={closeWindow} />
                    </Flex>
                    {/* <Flex className="mt-5">
                        <Filterhotel setPriceRange={setPriceRange} />
                    </Flex> */}
                </>
            ) : (
                <HotelListAdaptive
                    openWindow={openWindow}
                    isLoading={isLoading}
                    data={originaldata}
                    conversationId={conversationId}
                    searchKey={searchKey}
                />
            )}
        </Content>
    );
};

export default HotelListSm;
