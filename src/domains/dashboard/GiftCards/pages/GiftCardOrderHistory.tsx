import { Content } from 'antd/es/layout/layout';

import OrderHistory from '@src/domains/dashboard/GiftCards/components/OrderHistoryTable';
import useScreenSize from '@src/hooks/useScreenSize';

import OrderHistoryMobileView from '../components/OrderHistoryTableMobile';

type Props = {};

const CardOrderHistory = (props: Props) => {
    const screen = useScreenSize();
    return (
        <Content className=" mb-20 mt-10">
            {screen.xs ? <OrderHistoryMobileView /> : <OrderHistory />}
        </Content>
    );
};

export default CardOrderHistory;
