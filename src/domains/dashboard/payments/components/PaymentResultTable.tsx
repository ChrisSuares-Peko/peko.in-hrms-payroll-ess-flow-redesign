import React from 'react';

import { Descriptions } from 'antd';
import Moment from 'moment';

import { formatPaymentMode } from '@utils/paymentInstrument';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PaymentResultTableProps } from '../types/index';

const PaymentResultTable: React.FC<PaymentResultTableProps> = ({ paymentData }) => {
    const formattedDateTime = Moment(paymentData?.transactionDate).format(
        'MMMM DD, YYYY, hh:mm:ss A'
    );
    return (
        <Descriptions bordered size="middle" column={1} className="lg:w-2/3 pg-success-table">
            <Descriptions.Item label="Date">{formattedDateTime}</Descriptions.Item>
            <Descriptions.Item label="Transaction ID">
                {paymentData?.corporateTxnId}
            </Descriptions.Item>
            <Descriptions.Item label="Service">
                {['Edenred', 'Xoxoday'].includes(paymentData?.serviceProvider ?? '')
                    ? 'Giftcards'
                    : paymentData?.serviceProvider}
            </Descriptions.Item>
            {paymentData?.mobileNo && (
                <Descriptions.Item label="Mobile Number">{paymentData?.mobileNo}</Descriptions.Item>
            )}

            {paymentData?.billPaymentParams?.map(
                (param, index) =>
                    param.paramName && (
                        <Descriptions.Item key={index} label={param.paramName}>
                            {param.paramValue || 'N/A'}
                        </Descriptions.Item>
                    )
            )}
            {paymentData.couponDiscount != null && paymentData.couponDiscount !== 0 && (
                <>
                    <Descriptions.Item label="Total Amount">{`₹ ${formatNumberWithLocalString(paymentData.amountInINR)}`}</Descriptions.Item>
                    <Descriptions.Item label="Coupon Discount">{`₹ ${formatNumberWithLocalString(paymentData.couponDiscount)}`}</Descriptions.Item>
                </>
            )}
            <Descriptions.Item label="Paid Amount">{`₹ ${formatNumberWithLocalString(paymentData?.amount)}`}</Descriptions.Item>
            <Descriptions.Item label="Payment Mode">
                {formatPaymentMode(paymentData?.paymentMode)}
            </Descriptions.Item>
        </Descriptions>
    );
};
export default PaymentResultTable;
