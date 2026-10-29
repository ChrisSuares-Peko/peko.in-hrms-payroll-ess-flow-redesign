import React, { useEffect } from 'react';

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Card, Col, Divider, Flex, Input, Row, Skeleton, Tag, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useGetwalletDenominations from '../hooks/useGetWalletDenominations';

type walletTypes = {
    selectedAmount: any;
    setSelectedAmount: any;
};
const WalletCard = ({ selectedAmount, setSelectedAmount }: walletTypes) => {
    const { user } = useAppSelector(state => state.reducer.user);
    const { Amount } = useAppSelector(state => state.reducer.pekoWallet);
    const { denominations, isLoading } = useGetwalletDenominations();
    useEffect(() => {
        if (Amount !== '' && !Number.isNaN(Number(Amount))) {
            const numeric = Number(Amount);
            if (numeric <= 100000) {
                setSelectedAmount(numeric);
            }
        }
    }, [Amount, setSelectedAmount]);

    const presetAmounts = Array.isArray(denominations)
        ? [...new Set(denominations)].sort((a, b) => a - b)
        : [];

    return (
        <Card
            className="h-full border-0 sm:rounded-2xl sm:border border-borderGray"
            styles={{ body: { padding: 0 } }}
        >
            <Flex justify="center" align="center" className="py-7" gap={10}>
                <Typography.Text className="xl:text-4xl xs:text-2xl lg:text-2xl ">
                    Wallet Balance:
                </Typography.Text>
                <Typography.Text className="font-semibold xl:text-4xl xs:text-2xl lg:text-2xl ">
                    {`₹ ${formatNumberWithLocalString(user?.balance! ?? 0)}`}
                </Typography.Text>
            </Flex>
            <Divider />
            <Flex vertical className="sm:px-14 xs:px-7 py-9">
                <Typography.Text className="text-lg font-medium">
                    Add Money to Wallet
                </Typography.Text>
                <Input
                    type="text"
                    value={selectedAmount ?? ''}
                    placeholder="Enter custom amount"
                    maxLength={8}
                    className="w-full h-16 mt-5 text-lg font-medium text-black border rounded-lg"
                    onChange={e => {
                        const { value } = e.target;

                        let filteredValue = value
                            .replace(/[^0-9.]/g, '')
                            .replace(/(\..*?)\..*/g, '$1');

                        if (filteredValue === '.') {
                            filteredValue = '0.';
                        }

                        if (filteredValue.includes('.')) {
                            filteredValue = filteredValue.replace(/(\.\d{2})\d+/, '$1');
                        }

                        const numericValue = filteredValue;

                        setSelectedAmount(numericValue);
                    }}
                />

                {isLoading && <Skeleton active paragraph={{ rows: 1 }} className="mt-8" />}
                {!isLoading && presetAmounts.length > 0 && (
                    <Row className="mt-8 gap-y-4 sm:gap-y-5" gutter={[12, 16]} justify="start">
                        {presetAmounts.map(price => (
                            <Col key={price} xs={12} sm={8} md={6} xl={4}>
                                <Tag
                                    onClick={() => setSelectedAmount(price)}
                                    style={{
                                        borderRadius: '0.5rem',
                                        backgroundColor: 'white',
                                        width: '100%',
                                    }}
                                    className={`text-center font-medium text-sm h-10 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                                        selectedAmount === price
                                            ? 'border border-red-500 bg-stone-50 text-red-500'
                                            : 'text-zinc-500 border border-gray-200 hover:border-red-300 hover:text-red-400'
                                    }`}
                                >
                                    ₹ {price}
                                </Tag>
                            </Col>
                        ))}
                    </Row>
                )}

                <Divider className="mt-8" />
                <div
                    className="flex items-start p-2 mt-5 rounded-lg sm:p-4 bg-yellow-50 "
                    style={{ background: '#FFFCEC' }}
                >
                    <ExclamationCircleFilled className="mt-1 mr-2 text-yellow-500" />
                    <div>
                        <strong>Note:</strong>
                        <ul className="mt-1 ml-2 text-sm font-medium text-gray-700 list-disc">
                            <li>Wallet can be used exclusively on Peko India platform.</li>
                            <li>
                                Funds cannot be withdrawn to your bank account or transferred to any
                                other bank account as per RBI guidelines.
                            </li>
                        </ul>
                    </div>
                </div>
            </Flex>
        </Card>
    );
};

export default WalletCard;
