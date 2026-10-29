import React from 'react';

import { Button, Flex, Grid, Input, Row, Typography } from 'antd';

const { useBreakpoint } = Grid;

const ApplyCoupon = () => {
    const screens = useBreakpoint();
    return (
        <Row>
            <Typography.Text className="text-lg font-bold sm:text-xl sm:leading-9">
                Apply Coupon Code
            </Typography.Text>
            <Typography.Paragraph className="text-xs font-light sm:text-base sm:leading-9">
                Have a discount/ promo code to redeem
            </Typography.Paragraph>
            {screens.xs ? (
                <Flex className="w-full mt-4">
                    <Input
                        placeholder="Enter promo code"
                        suffix={<a className="text-black">Apply</a>}
                    />
                </Flex>
            ) : (
                <Flex className="w-full gap-4 mt-4">
                    <Input placeholder="Enter promo code" />
                    <Button danger style={{ borderRadius: 2 }} type="primary" size="middle">
                        Apply
                    </Button>
                </Flex>
            )}
        </Row>
    );
};

export default ApplyCoupon;
