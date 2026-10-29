import { memo, useEffect, useState } from 'react';

import { Flex, Typography, theme } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import ReviewAmount from '../components/ReviewAmount';
import ShipmentDetailsForm from '../components/ShipmentDetailsForm';
import { setIsComingFromDetails } from '../slice/logisticsSlice';
import { shippingAmount } from '../types/index';

const initialShippingAmount: shippingAmount = {
    charges: 0,
    city: '',
};

const MemoizedReviewAmount = memo(ReviewAmount);
const MemoizedShipmentDetailsForm = memo(ShipmentDetailsForm);

const ShipmentDetails = () => {
    const [showReviewScreen, setShowReviewScreen] = useState<shippingAmount>(initialShippingAmount);
    const dispatch = useDispatch();
    const {
        token: { colorPrimary },
    } = theme.useToken();
    useEffect(() => {
        dispatch(setIsComingFromDetails(true));
    }, [dispatch]);

    return (
        <Content className="px-0 mb-8">
            <Flex vertical>
                <Flex className="mb-6 text-lg font-medium">Order Details</Flex>
                <Typography.Paragraph className="pb-5 text-textGrey">
                    Please check the list of prohibited items{' '}
                    <Link
                        to="https://www.aramex.com/content/uploads/100/55/32335/Prohibited%20Items%20List.pdf"
                        target="_blank"
                        className="underline"
                        style={{ color: colorPrimary }}
                    >
                        here
                    </Link>
                    .
                </Typography.Paragraph>
                <MemoizedShipmentDetailsForm setShowReviewScreen={setShowReviewScreen} />
            </Flex>
            {showReviewScreen.charges !== 0 && <MemoizedReviewAmount data={showReviewScreen} />}
        </Content>
    );
};

export default ShipmentDetails;
