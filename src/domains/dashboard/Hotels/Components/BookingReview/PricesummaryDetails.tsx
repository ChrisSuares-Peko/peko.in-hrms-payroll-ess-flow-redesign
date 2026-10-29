import { Col, Flex, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

const { Text } = Typography;

interface price {
    total: number;
    room: number;
    taxes: number;
    mediCancel: number;
    ct: number;
}

const PricesummaryDetails = ({ total, room, taxes, mediCancel, ct }: price) => {
    const { netAmount } = useAppSelector(state => state.reducer.hotels);

    return (
        <>
            <Text className="font-bold mt-3">Your Price Summary</Text>
            <Flex vertical>
                <Row gutter={[16, 16]} className="pt-5">
                    <Col span={12}>
                        <Text className="mt-1">Subtotal</Text>
                    </Col>
                    <Col span={12}>
                        <Text className="mt-1">₹ {netAmount}</Text>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} className="pt-5">
                    <Col span={12}>
                        <Text className="mt-1">Taxes and fees</Text>
                    </Col>
                    <Col span={12}>
                        <Text className="mt-1">₹ 0.00</Text>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} className="pt-5">
                    <Col span={12}>
                        <Text className="mt-1">Total price</Text>
                    </Col>
                    <Col span={12}>
                        <Text className="mt-1">₹ {netAmount}</Text>
                    </Col>
                </Row>
            </Flex>
        </>
    );
};

export default PricesummaryDetails;
