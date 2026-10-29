import React from 'react';

import { Col, Flex, Grid, Row, Typography } from 'antd';

interface details {
    column1: string;
    column2: string;
    column3: string;
    desc?: string;
    disc?: string;
}
const PaymentDetails = ({ column1, column2, column3, desc, disc }: details) => {
    const screens = Grid.useBreakpoint();
    const isXs = screens.xs;
    return (
        <Row>
            <Col xl={8} xs={24}>
                <Typography.Text className="xs:font-medium xl:font-normal">
                    {column1}
                </Typography.Text>
            </Col>
            <Col xl={9} xs={12} className="xs:mt-2 xl:mt-0">
                <Flex gap={7} vertical={isXs}>
                    <Typography.Text className="font-normal">{column2}</Typography.Text>
                    <Typography.Text className="font-normal text-red-500">{desc}</Typography.Text>
                </Flex>
            </Col>
            <Col xl={7} xs={12} className="xs:mt-2 md:mt-0">
                <Flex gap={7} vertical={isXs}>
                    <Typography.Text className="font-normal">{column3}</Typography.Text>
                    <Typography.Text className="font-normal text-red-500">{disc}</Typography.Text>
                </Flex>
            </Col>
        </Row>
    );
};
export default PaymentDetails;
