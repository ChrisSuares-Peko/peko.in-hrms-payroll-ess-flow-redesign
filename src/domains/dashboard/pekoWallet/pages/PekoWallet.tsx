// PekoWallet.tsx
import React, { useEffect, useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import ReviewPayment from '../components/ReviewPayment';
import WalletCard from '../components/WalletCard';
import { resetAmount } from '../slice/WalletSlice';

const PekoWallet = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

    useEffect(() => {
        dispatch(resetAmount());
        setSelectedAmount(null);
    }, [dispatch]);

    return (
        <Row gutter={40}>
            <Col span={24}>
                <Flex justify="space-between" className="xs:mt-10 sm:mt-0">
                    <Typography.Text className="flex-shrink-0 text-lg font-medium sm:text-xl">
                        Peko Wallet
                    </Typography.Text>
                    <Button
                        type="default"
                        danger
                        className="text-xs md:px-3 md:text-sm"
                        onClick={() => navigate(paths.pekoWallet.transactionHistory)}
                    >
                        Wallet History
                    </Button>
                </Flex>
            </Col>
            <Col xs={24} md={15} className="mt-7">
                <WalletCard selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount} />
            </Col>
            <Col xs={24} md={9} className="mt-7">
                <ReviewPayment selectedAmount={selectedAmount} />
            </Col>
        </Row>
    );
};

export default PekoWallet;
