import React, { useEffect, useState } from 'react';

import { Button, Col, Flex, Image, InputNumber, Row, Typography } from 'antd';
import Lottie from 'react-lottie';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import animation from '@assets/animation/EsimLoader.json';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import DataSVG from '../assets/icons/Data.svg';
import CalenderSVG from '../assets/icons/Globe.svg';
import MessageSVG from '../assets/icons/Message.svg';
import PhoneSVG from '../assets/icons/Phone.svg';
import AdditionalInfoList from '../components/details/AdditionalInfoList';
import OtherPackages from '../components/details/OtherPackages';
import useSearchPackages from '../hooks/useSearchPackages';
import { Operator, Package, PackageListItem } from '../types/packagesList';

type Props = {};

const Details = (props: Props) => {
    const { state } = useLocation();
    const [filteredData, setFilteredData] = useState<Operator>();
    const [packageData, setPackageData] = useState<Package>();
    const [otherPackagesData, setOtherPackagesData] = useState<Package[]>();
    const [quantity, setQuantity] = useState<number>(1);
    const { data, conversionRate, isLoading } = useSearchPackages(state.country, state.esimType);

    const price = packageData && Number(packageData.price);
    const totalPrice = price && formatNumberWithLocalString(price * quantity * conversionRate);

    useEffect(() => {
        if (data) {
            const packageDetails: PackageListItem[] = [];

            data.forEach(item => {
                if (state.country !== '' && state.esimType === 'local') {
                    if (item.country_code === state.country) {
                        packageDetails.push(item);
                    }
                }
                if (state.region !== '' && state.esimType === 'regional') {
                    if (item.slug === state.region) {
                        packageDetails.push(item);
                    }
                }
                if (state.esimType === 'global') {
                    if (item.slug === 'world') {
                        packageDetails.push(item);
                    }
                }
            });
            const recomendedPackages: Package[] = [];
            if (packageDetails.length === 0) return;
            packageDetails[0].operators[0].packages.forEach(item => {
                if (
                    item.price === state.price &&
                    item.data === state.data &&
                    item.id === state.id
                ) {
                    setPackageData({
                        ...item,
                        esimType: packageDetails[0].operators[0].esim_type,
                    });
                } else {
                    recomendedPackages.push({
                        ...item,
                        esimType: packageDetails[0].operators[0].esim_type,
                    });
                }
            });
            setFilteredData(packageDetails[0].operators[0]);
            setOtherPackagesData(recomendedPackages);
        }
    }, [data, state]);

    const handlePayment = () => {
        // Payment handling logic
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return (
        <>
            {!filteredData || isLoading ? (
                <Flex justify="center" align="middle" className="w-full h-full min-h-[300px]">
                    <Lottie
                        options={defaultOptions}
                        height="100%"
                        width="100%"
                        isClickToPauseDisabled
                        style={{ maxWidth: '400px', maxHeight: '300px' }}
                    />
                </Flex>
            ) : (
                <Row gutter={[20, 20]}>
                    <Col xs={24} sm={6}>
                        <Image src={filteredData && filteredData.image.url} preview={false} />
                    </Col>
                    <Col className="" xs={24} sm={18}>
                        <Flex
                            className="h-full"
                            justify="space-between"
                            align="start"
                            gap={15}
                            vertical
                        >
                            <Flex className="h-1/2" gap={5} vertical>
                                <Typography.Text className="text-red-500 font-medium text-2xl">
                                    {filteredData && filteredData.title}
                                </Typography.Text>
                                <Flex gap={20} wrap="wrap" className="mt-4">
                                    <Flex>
                                        <ReactSVG src={PhoneSVG} />
                                        <Typography.Text className="text-xs text-textGrey ms-2">
                                            Voice:
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-textBlack font-medium ms-1">
                                            {packageData?.voice
                                                ? `${packageData?.voice} min`
                                                : 'N/A'}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex>
                                        <ReactSVG src={MessageSVG} />
                                        <Typography.Text className="text-xs text-textGrey ms-2">
                                            SMS:
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-textBlack font-medium ms-1">
                                            {packageData?.text ?? 'N/A'}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex>
                                        <ReactSVG src={DataSVG} />
                                        <Typography.Text className="text-xs text-textGrey ms-2">
                                            Data:
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-textBlack font-medium ms-1">
                                            {packageData?.data ?? 'N/A'}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex>
                                        <ReactSVG src={CalenderSVG} />
                                        <Typography.Text className="text-xs text-textGrey ms-2">
                                            Validity:
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-textBlack font-medium ms-1">
                                            {packageData?.day ? `${packageData?.day} Days` : 'N/A'}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            </Flex>
                            <Flex className="h-1/2" gap={10} vertical>
                                <Typography.Text className="text-lg text-textBlack font-medium">
                                    ₹ {totalPrice}
                                </Typography.Text>

                                <Flex gap={20}>
                                    <InputNumber
                                        className="rounded-sm"
                                        onChange={(value: number | null) =>
                                            setQuantity(value ? Math.round(value) : 1)
                                        } // Ensures only integers are set
                                        value={quantity}
                                        min={1}
                                        max={50}
                                        precision={0} // Restrict to integer precision
                                        step={1} // Allow only step increments of 1
                                        stringMode={false} // Ensure the value is numeric
                                    />

                                    <Button type="primary" danger onClick={() => handlePayment()}>
                                        Buy Now
                                    </Button>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Col>

                    <AdditionalInfoList
                        eKyc={filteredData && filteredData.is_kyc_verify}
                        network={filteredData && filteredData.title}
                        planType={packageData && packageData.esimType}
                        topUpOption={filteredData && filteredData.rechargeability}
                        countries={filteredData && filteredData.countries}
                    />

                    <OtherPackages
                        packages={otherPackagesData}
                        conversionRate={conversionRate}
                        state={state}
                    />
                </Row>
            )}
        </>
    );
};

export default Details;
