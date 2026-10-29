import type { FC } from 'react';

import { Flex, Typography } from 'antd';
import moment from 'moment';

import { useAppSelector } from '@src/hooks/store';

interface CancelledSectionProps {}

const CancelledSection: FC<CancelledSectionProps> = () => {
    const orderResponse = useAppSelector(
        state => state.reducer.orderDetails.orderDetails?.orderResponse
    );

    return (
        <>
            <Flex vertical className="mt-10 mb-4">
                <Typography.Title
                    level={4}
                    style={{
                        color: '#D00003',
                        fontFamily: 'Roboto',
                        marginTop: '20px',
                    }}
                >
                    Cancelled on{' '}
                    {moment(orderResponse.cancelRequestDate).format('dddd, Do MMM, h:mm A')}
                </Typography.Title>
            </Flex>
            <Flex gap={0} vertical className="mb-10">
                <Typography.Text className="font-roboto text-black text-base ">
                    Cancellation reason: {orderResponse?.cancelReason || ''}
                </Typography.Text>
                <Typography.Text className="font-roboto text-black text-base ">
                    Refund will be credited to the original payment method within 7-10 working days
                </Typography.Text>
            </Flex>
        </>
    );
};

export default CancelledSection;
