/* eslint-disable no-nested-ternary */
import React from 'react';

import { Col, Skeleton, Descriptions } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { transferFundsDetailsResponse } from '../types/SelfTransferTypes';

type Props = {
    walletDetails?: transferFundsDetailsResponse;
    isLoading: boolean;
};

const DetailsTransferFunds = ({ isLoading, walletDetails }: Props) => (
    <Col xs={24} sm={12} lg={14}>
        {isLoading ? (
            <Skeleton active />
        ) : walletDetails ? (
            <Descriptions layout="horizontal" bordered title={` Account Details`}>
                <Descriptions.Item span={24} labelStyle={{ fontWeight: 'bold' }} label="Account ID">
                    {walletDetails.username}
                </Descriptions.Item>
                <Descriptions.Item
                    span={24}
                    label="Corporate Name"
                    labelStyle={{ fontWeight: 'bold' }}
                >
                    {walletDetails.name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item span={24} label="City" labelStyle={{ fontWeight: 'bold' }}>
                    {walletDetails.city || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item
                    span={24}
                    label="Mobile Number"
                    labelStyle={{ fontWeight: 'bold' }}
                >
                    {walletDetails.mobileNo || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item
                    span={24}
                    label="Wallet Balance"
                    labelStyle={{ fontWeight: 'bold' }}
                >
                    ₹ {formatNumberWithLocalString(Number(walletDetails.balance)) || 0}
                </Descriptions.Item>
                <Descriptions.Item
                    span={24}
                    label="Partner Name"
                    labelStyle={{ fontWeight: 'bold' }}
                >
                    {walletDetails.registeredByName || 'N/A'}
                </Descriptions.Item>
            </Descriptions>
        ) : (
            ''
        )}
    </Col>
);

export default DetailsTransferFunds;
