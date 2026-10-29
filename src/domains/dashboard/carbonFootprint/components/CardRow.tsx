import React from 'react';

import { Col, Row } from 'antd';

import CustomCards from './CustomCards';

type Props = {
    data: {
        img: string;
        title: string;
        value: string;
    }[];
};

const CardRow = ({ data }: Props) => (
    <Row gutter={[30, 30]} className="md:px-20">
        {data.map((ele, i) => (
            <Col key={i} className="flex justify-center md:block" xs={12} md={8} lg={8} xl={6}>
                <CustomCards img={ele.img} title={ele.title} value={ele.value} />
            </Col>
        ))}
    </Row>
);

export default CardRow;
