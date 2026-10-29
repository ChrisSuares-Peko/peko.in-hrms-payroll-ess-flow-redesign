import React from 'react';

import { Col, Row } from 'antd';

import BagIcon from '@domains/systemUser/ecom_manager/home/assets/icons/bag.svg';
import CartIcon from '@domains/systemUser/ecom_manager/home/assets/icons/cart.svg';
import TotalDataCard from '@domains/systemUser/ecom_manager/home/components/TotalDataCard';

type Props = {
    products?: number;
    orders?: number;
    isLoading: boolean;
};

const TotalData = ({ products, orders, isLoading }: Props) => (
    <Row gutter={[20, 20]} className="pt-10">
        <Col xs={24} md={12}>
            <TotalDataCard icon={BagIcon} title="Total Orders" value={products?.toString()} />
        </Col>
        <Col xs={24} md={12}>
            <TotalDataCard
                icon={CartIcon}
                title="Total no. of products"
                value={orders?.toString()}
            />
        </Col>
    </Row>
);

export default TotalData;
