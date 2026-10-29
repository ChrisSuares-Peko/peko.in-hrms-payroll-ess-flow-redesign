import React from 'react';

import { Flex, Image, Row, Skeleton, Typography } from 'antd';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateTime } from '@utils/dateFormat';

import CalenderSVG from '../../assets/icons/Calender.svg';
import DataSVG from '../../assets/icons/Data.svg';
import GlobeSVG from '../../assets/icons/Globe.svg';
import DefaultImage from '../../assets/images/DefaultEsim.png';
import DefaultImageSm from '../../assets/images/EsimSm.png';
import useGetQRcode from '../../hooks/useGetQRcode';

type Props = {
    newTopupData: string;
    validity: string;
    countryName: string;
    corporateTxnId: string;
    planName?: string;
    activatedAt?: string | null;
    expiresAt?: string | null;
};

const DetailsLeft = ({
    newTopupData,
    validity,
    countryName,
    corporateTxnId,
    planName,
    activatedAt,
    expiresAt,
}: Props) => {
    // const { iccid } = useLocation().state;
    const location = useLocation();
    const { sm } = useScreenSize();
    const iccid = location.state?.iccid || JSON.parse(sessionStorage.getItem('ESIM') || '{}').iccid;

    const { QRCodeURL, isLoading: QRLoading, isTopUp } = useGetQRcode(
        iccid,
        corporateTxnId,
        location.state?.customerUid
    );
    const packageDetails = [
        {
            icon: DataSVG,
            title: 'Plan:',
            value: planName || 'N/A',
        },
        {
            icon: DataSVG,
            title: 'Data:',
            value: newTopupData || 'N/A',
        },
        {
            icon: CalenderSVG,
            title: 'Validity:',
            value: validity || 'N/A',
        },
        {
            icon: GlobeSVG,
            title: 'Coverage:',
            value: countryName || 'N/A',
        },
        {
            icon: CalenderSVG,
            title: 'Activated On:',
            value: activatedAt ? formattedDateTime(new Date(activatedAt)) : 'Not activated yet',
        },
        {
            icon: CalenderSVG,
            title: activatedAt ? 'Expires On:' : 'Activate By:',
            value: expiresAt ? formattedDateTime(new Date(expiresAt)) : 'N/A',
        },
    ];

    return (
        <Flex className="px-1" gap={25} vertical>
            {sm ? (
                <Image src={DefaultImage} preview={false} />
            ) : (
                <Image src={DefaultImageSm} preview={false} />
            )}
            <Flex vertical className="pl-2">
                <Flex className="mb-8">
                    <Typography.Text className="font-medium text-3xl">
                        Float by Peko
                    </Typography.Text>
                </Flex>
                <Flex gap={20} vertical>
                    {packageDetails?.map((item, i) => (
                        <Flex>
                            <ReactSVG
                                src={item.icon}
                                beforeInjection={svg => {
                                    svg.setAttribute('width', '15px');
                                    svg.setAttribute('height', '15px');
                                }}
                            />
                            <Typography.Text className="text-sm ms-2  text-textGrey text-nowrap">
                                {item?.title}
                            </Typography.Text>
                            <Typography.Text className="text-sm font-medium text-textBlack ms-2 text-nowrap">
                                {item?.value}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
                <Flex className="w-full bg-yellow-50 p-2 my-5 mx-0 rounded ">
                    <Typography.Text className="text-yellow-400 text-justify text-sm ">
                        {isTopUp
                            ? 'No new QR code needed for top-ups.'
                            : 'Warning! Most eSIMs can only be installed once. If you remove the eSIM from your device, you cannot install it again.'}
                    </Typography.Text>
                </Flex>
                {iccid && !isTopUp && (
                    <Flex vertical className="mt-2">
                        <Typography.Text className="text-base text-textBlack ms-1">
                            Install eSIM
                        </Typography.Text>
                        <Row className="mt-6">
                            {QRLoading ? (
                                <Skeleton />
                            ) : (
                                <Image
                                    src={QRCodeURL}
                                    preview={false}
                                    width={110}
                                    height={110}
                                    className="mt-2 flex w-full"
                                />
                            )}
                            <Flex
                                className="w-48 py-2 ms-3 flex-wrap"
                                justify="space-between"
                                vertical
                            >
                                <Typography.Text className="text-xs text-textGrey">
                                    Scan the QR code by printing out or displaying the code on
                                    another device to install your eSIM.
                                </Typography.Text>
                                <Typography.Text className="text-xs text-textGrey mt-3">
                                    *Make sure your device has a stable internet connection before
                                    installing.
                                </Typography.Text>
                            </Flex>
                        </Row>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
};

export default DetailsLeft;
