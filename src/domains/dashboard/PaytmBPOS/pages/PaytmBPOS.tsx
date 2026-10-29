import { Button, Col, Flex, Row, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import SlideCards from '../components/SlideCards';

const PaytmBPOS = () => {
    const navigate = useNavigate();
    return (
        <Row className="xs:mx-0 md:mx-8 mt-6">
            <Row className="w-full justify-between">
                <Col span={15}>
                    <Flex vertical>
                        <Typography.Text className="text-valueText text-sm sm:text-xl font-semibold">
                            Paytm Billing Software
                        </Typography.Text>
                        <Typography.Text className="text-gray-500 text-xs">
                            A software driven by data for 360° Store Management
                        </Typography.Text>
                    </Flex>
                </Col>
                <Link to="order-history">
                    <Button type="default" danger className="md:px-5 text-xs md:text-sm">
                        Order History
                    </Button>
                </Link>
            </Row>

            <Col className="mt-5" span={24}>
                <SlideCards />
            </Col>
            <Col className="h-20 flex justify-center mt-14" span={24}>
                <Button
                    type="primary"
                    className="px-10"
                    size="large"
                    onClick={() => navigate(paths.paytmBpos.request)}
                    danger
                >
                    Get a Demo
                </Button>
            </Col>
        </Row>
    );
};

export default PaytmBPOS;
