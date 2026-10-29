import React from 'react';

import { Badge, Button, Flex, Typography } from 'antd';

import CartIcon from '../../assets/svg/cart.svg';

const { Title } = Typography;

interface Props {
    cartBadgeCount: number;
    onOrderHistory: () => void;
    onCart: () => void;
}

const LandingPageHeader: React.FC<Props> = ({ cartBadgeCount, onOrderHistory, onCart }) => (
    <Flex justify="space-between" align="center" wrap="wrap" gap={8} className="mb-6">
        <Title level={4} style={{ margin: 0, fontWeight: 500 }}>
            Domain & Hosting
        </Title>
        <Flex gap={12} align="center">
            <Button onClick={onOrderHistory} className="border-brandPrimary text-brandPrimary">
                Order History
            </Button>
            <Flex align="center" gap={6} className="cursor-pointer" onClick={onCart}>
                <Badge count={cartBadgeCount} color="#FF4F4F" showZero={false}>
                    <img src={CartIcon} alt="cart" className="w-6 h-6" />
                </Badge>
                <span className="text-sm">Cart</span>
            </Flex>
        </Flex>
    </Flex>
);

export default LandingPageHeader;
