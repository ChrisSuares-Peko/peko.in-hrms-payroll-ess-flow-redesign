import { Flex, Skeleton } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useParams } from 'react-router-dom';

// import OrderProductDetails from '../components/orderDetails/OrderedProductDetails';
// import ShipmentDetails from '../components/orderDetails/ShipmentDetails';
import TopSection from '../components/orderDetails/TopSection';
import { useOrderDetailsApi } from '../hooks/useOrderDetailsApi';

function OrderDetailsPage() {
    const { id } = useParams();
    const { isLoading } = useOrderDetailsApi(id!);
    return (
        <>
            {isLoading ? (
                <Flex vertical gap={50}>
                    <Skeleton avatar paragraph={{ rows: 4 }} />
                    <Skeleton paragraph={{ rows: 10 }} />
                </Flex>
            ) : (
                <Content>
                    <TopSection />
                    {/* <ShipmentDetails /> */}
                </Content>
            )}
        </>
    );
}

export default OrderDetailsPage;
