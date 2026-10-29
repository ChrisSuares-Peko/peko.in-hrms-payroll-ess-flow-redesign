import { Content } from 'antd/es/layout/layout';

import { useAppSelector } from '@src/hooks/store';

import RoomSelection from '../Components/RoomSelection';
import useHotelDetailsApi from '../hooks/useHotelDetailsApi';

const HotelView = () => {
    const { keyData } = useAppSelector(state => state.reducer.hotels);

    const { conversationId } = keyData;

    const { isLoading } = useHotelDetailsApi(conversationId);
    return (
        <Content>
            <RoomSelection isLoading={isLoading} />
        </Content>
    );
};

export default HotelView;
