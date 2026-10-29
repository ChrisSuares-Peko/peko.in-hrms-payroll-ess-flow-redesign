import React, { useEffect, useRef } from 'react';

import { Flex, Row, Col } from 'antd';

import ReviewLeftCard from './ReviewLeftCard';
import ReviewRightCard from './ReviewRightCard';
import { shippingAmount } from '../types/index';

interface ReviewAmountProps {
    data: shippingAmount;
}

const MemoizedReviewLeftCard = React.memo(ReviewLeftCard);
const MemoizedReviewRightCard = React.memo(ReviewRightCard);

const ReviewAmount: React.FC<ReviewAmountProps> = ({ data }) => {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [data]);

    return (
        <Flex vertical className="mt-14" ref={bottomRef}>
            <Flex className="mb-6 text-lg font-medium">Review Details</Flex>
            <Row gutter={16} className=" xl:w-9/12">
                <Col xs={24} sm={12}>
                    <MemoizedReviewLeftCard />
                </Col>
                <Col xs={24} sm={12}>
                    <MemoizedReviewRightCard charges={data.charges} city={data.city} />
                </Col>
            </Row>
        </Flex>
    );
};

export default ReviewAmount;
