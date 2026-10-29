import React, { useCallback, useState } from 'react';

import { Button, Col, Flex, Row, Skeleton, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PurchaseDetails from '../components/purchase/PurchaseDetails';
import useGetAllHike from '../hooks/useGetAllHikes';
import { useGetEmployee } from '../hooks/useGetEmployee';
import { setAmount, setHikeArray } from '../slices/hikeSlice';

const { Text } = Typography;

const PurchasePage: React.FC = () => {
    const navigate = useNavigate();
    const { xs } = useScreenSize();
    const dispatch = useDispatch();
    const [updatedItems, setUpdatedItems] = useState<
        {
            id: number;
            quantity: number;
            price: number;
            hikeName: string;
            totalPrice: number;
            employees: any[];
            logo: any;
        }[]
    >([]);
    const { data } = useGetEmployee();
    const { hikeData, loading } = useGetAllHike();

    const handleUpdateItem = useCallback(
        (
            id: number,
            quantity: number,
            price: number,
            hikeName: string,
            totalPrice: number,
            employees: any[],
            logo: any
        ) => {
            setUpdatedItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === id);
                if (existingItem) {
                    return prevItems.map(item =>
                        item.id === id
                            ? { ...item, quantity, price, hikeName, totalPrice, employees, logo }
                            : item
                    );
                }
                return [
                    ...prevItems,
                    { id, quantity, price, hikeName, totalPrice, employees, logo },
                ];
            });
        },
        [setUpdatedItems]
    );

    const handleButtonClick = useCallback(() => {
        const amount = updatedItems.reduce((acc, item) => acc + item.totalPrice, 0);

        dispatch(setHikeArray(updatedItems));
        dispatch(setAmount(amount));

        if (updatedItems.length <= 0) {
            dispatch(
                showToast({
                    description: 'Please select any hike',
                    variant: 'error',
                })
            );
            return;
        }

        const hasValidHikes = updatedItems.every(item => item.quantity > 0);

        if (!hasValidHikes) {
            dispatch(
                showToast({
                    description: 'Please select any hike',
                    variant: 'error',
                })
            );
            return;
        }

        navigate(paths.hike.checkoutPage);
    }, [updatedItems, dispatch, navigate]);

    return (
        <>
            {loading ? (
                <Skeleton data-testid="skeleton-loading" />
            ) : (
                <>
                    <Text className="text-lg font-medium">
                        Start offering excellent benefits now
                    </Text>

                    <Row gutter={20} className="py-4">
                        {hikeData?.map((datas, index) => (
                            <Col key={datas.id} xs={24}>
                                <PurchaseDetails
                                    logo={datas.logo}
                                    id={datas.id}
                                    onUpdateItem={handleUpdateItem}
                                    data={data}
                                    price={datas.amount}
                                    hikeName={datas.name}
                                    salaryAmt={datas.salaryAmount}
                                    salaryValidation={datas.salaryValidation}
                                />
                            </Col>
                        ))}
                    </Row>
                    {xs ? (
                        <Col xs={24} md={22}>
                            <Flex vertical>
                                <Text className="mt-2 font-medium text-medium">
                                    Upon successful completion of the purchase, the voucher details
                                    will be sent to the employees via email.
                                </Text>
                                <Flex gap={40}>
                                    <Flex gap={10}>
                                        <Text className="mt-2 font-medium text-medium">
                                            Total Amount:
                                        </Text>
                                        <Text className="mt-2 font-bold text-medium">
                                            ₹{' '}
                                            {formatNumberWithLocalString(
                                                updatedItems.reduce(
                                                    (acc, item) => acc + item.totalPrice,
                                                    0
                                                )
                                            )}
                                        </Text>
                                    </Flex>

                                    <Button
                                        danger
                                        size="small"
                                        type="primary"
                                        onClick={handleButtonClick}
                                        className="justify-center w-24 text-xs font-normal rounded-md h-9 sm:text-base sm:font-medium sm:w-32"
                                    >
                                        Buy Now
                                    </Button>
                                </Flex>
                            </Flex>
                        </Col>
                    ) : (
                        <Col xs={24} md={22}>
                            <Flex justify="space-between">
                                <Text className="mt-2 font-medium text-medium md:w-2/5 xl:w-1/2">
                                    Upon successful completion of the purchase, the voucher details
                                    will be sent to the employees via email.
                                </Text>
                                <Flex gap={20} wrap="wrap">
                                    <Flex gap={10}>
                                        <Text className="mt-2 font-medium text-medium">
                                            Total Amount:
                                        </Text>
                                        <Text className="mt-2 font-bold text-medium">
                                            ₹{' '}
                                            {formatNumberWithLocalString(
                                                updatedItems.reduce(
                                                    (acc, item) => acc + item.totalPrice,
                                                    0
                                                )
                                            )}
                                        </Text>
                                    </Flex>

                                    <Button
                                        danger
                                        type="primary"
                                        onClick={handleButtonClick}
                                        // className="justify-center w-24 text-xs font-normal rounded-md h-9 sm:text-base sm:font-medium sm:w-32"
                                    >
                                        Buy Now
                                    </Button>
                                </Flex>
                            </Flex>
                        </Col>
                    )}
                </>
            )}
        </>
    );
};

export default PurchasePage;
