import { useEffect } from 'react';

import { Grid } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useDispatch } from 'react-redux';

import DetailsWeb from '../Components/HotelListing/DetailsWeb';
import HotelListSm from '../Components/HotelListing/HotelListSm';
import useSearchApi from '../hooks/useSearchApi';
import { resetHotelBookingStartedAt } from '../slices/getHotelSlice';

const { useBreakpoint } = Grid;

const Details = () => {
    const { isLoading, data, conversationId, searchKey, hotelsList } = useSearchApi();
    const dispatch=useDispatch()
    const screens = useBreakpoint();
    useEffect(() => {
    dispatch(resetHotelBookingStartedAt());
}, [dispatch]);


    return (
        <Content>
            {screens.md ? (
                <DetailsWeb
                    isLoading={isLoading}
                    // originaldata={data}
                    conversationId={conversationId}
                    searchKey={searchKey}
                    hotelsSearch={hotelsList}
                />
            ) : (
                <HotelListSm
                    isLoading={isLoading}
                    originaldata={data}
                    conversationId={conversationId}
                    searchKey={searchKey}
                />
            )}
        </Content>
    );
};

export default Details;
