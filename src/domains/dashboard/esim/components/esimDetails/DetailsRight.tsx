import React, { useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import DataSVG from '../../assets/icons/DataBlack.svg';
import usePayment from '../../hooks/useTopupPayment';
import TopUpModal from '../orders/TopUpModal';

type Props = {
    dataBal: string;
    iccid: string;
    country?: string;
};

const DetailsRight = ({ dataBal, iccid, country }: Props) => {
    const dispatch = useAppDispatch();
    // const { planId } = useLocation().state;
    const location = useLocation();
    const planId =
        location.state?.planId || JSON.parse(sessionStorage.getItem('ESIM') || '{}').planId;

    const [openModal, setOpenModal] = useState(false);
    const { handleSubmission } = usePayment();

    const handleTopUpSubmit = async (
        selectedData: string,
        selectedValidity: string,
        selectedCountry: string
    ) => {
        if (!selectedCountry || !selectedData || !selectedValidity) {
            dispatch(
                showToast({ description: 'Please select plan and validity', variant: 'error' })
            );
            return;
        }
        const postData = {
            orders: [
                {
                    country: selectedCountry,
                    data: Number(selectedData) * 1024,
                    validity: Number(selectedValidity),
                    quantity: 1,
                    iccid: iccid ?? '',
                },
            ],
        };

        handleSubmission(postData);
        setOpenModal(false);
    };

    const dataBalValue = parseFloat(dataBal);
    const hasRemainingData = !!dataBal && !Number.isNaN(dataBalValue) && dataBalValue > 0;

    return (
        <>
            {hasRemainingData && (
                <Row gutter={[20, 20]} justify="start">
                    <Col xs={24} sm={22} md={15} xl={10} xxl={6} className="w-full p-0 mt-5">
                        <Flex className="bg-esimInfoCardPink xs:w-full xs:h-48 md:h-48 rounded-2xl px-4">
                            <Flex
                                className="w-full h-full ms-1"
                                justify="center"
                                align="self-start"
                                vertical
                            >
                                <Flex
                                    className="bg-white h-10 w-10 rounded-full p-4"
                                    justify="center"
                                    align="center"
                                >
                                    <ReactSVG src={DataSVG} className="text-textBlack" />
                                </Flex>
                                <Typography.Text className="text-xl text-textBlack font-semibold mt-4">
                                    {dataBal || 'N/A'}
                                </Typography.Text>
                                <Typography.Text className="text-base text-textBlack">
                                    Remaining Data
                                </Typography.Text>
                                <Flex className="p-3 py-3 w-full">
                                    <Button
                                        type="primary"
                                        className="w-full"
                                        danger
                                        disabled={!planId}
                                        onClick={() => {
                                            setOpenModal(true);
                                        }}
                                    >
                                        Top-Up eSIM
                                    </Button>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Col>
                </Row>
            )}
            {openModal && (
                <TopUpModal
                    handleCancel={() => setOpenModal(false)}
                    handleSubmit={handleTopUpSubmit}
                    planId={planId}
                    isLoading={false}
                    isOpen={openModal}
                    country={country}
                    iccid={iccid}
                />
            )}
        </>
    );
};

export default DetailsRight;
