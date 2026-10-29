import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Modal, Radio, Row, Skeleton, Typography } from 'antd';

import { paths } from '@src/routes/paths';
import {
    formatNumberWithLocalString,
    formatNumberWithLocalStringWithoutDecimalPoint,
} from '@utils/priceFormat';

import useGetPlansAndDetails from '../../hooks/useGetPlansAndDetails';

const { Text } = Typography;

interface TopUpModalProps {
    isOpen: boolean;
    handleCancel: () => void;
    handleSubmit: (selectedData: string, selectedValidity: string, selectedCountry: string) => void;
    isLoading: boolean;
    planId?: string;
    country?: string;
    iccid?: string;
}

const TopUpModal = ({ isOpen, handleCancel, handleSubmit, isLoading, planId, country, iccid }: TopUpModalProps) => {
    const [selectedData, setSelectedData] = useState('');
    const [selectedValidity, setSelectedValidity] = useState('');
    const { isLoading: listLoading, plans } = useGetPlansAndDetails(planId as string, country as string);

    // Validity field varies by provider — keep original precedence (validityDays first).
    const getValidity = (option: any) => option?.validityDays ?? option?.periodDays;

    const handleDataClick = (data: string) => {
        setSelectedData(String(data));
        // Keep the current validity if it's available for the newly selected data,
        // otherwise fall back to the first validity available for that data.
        const availableForData = plans?.filter(option => Number(option.dataGB) === Number(data));
        const stillValid = availableForData?.some(
            option => String(getValidity(option)) === String(selectedValidity)
        );
        if (!stillValid && availableForData?.length) {
            setSelectedValidity(String(getValidity(availableForData[0])));
        }
    };

    const handleValidityClick = (data: string) => {
        setSelectedValidity(String(data));
    };

    const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, action: () => void) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    };

    useEffect(() => {
        if (plans && plans.length > 0) {
            setSelectedData(String(plans[0].dataGB));
            setSelectedValidity(String(plans[0].validityDays ?? plans[0].periodDays));
        }
    }, [plans]);

    const { iccid: sessionIccid } = JSON.parse(sessionStorage.getItem('ESIM') || '{}');
    const saveDetailsToSession = useCallback(() => {
        let url = '';
        if (sessionIccid === '{}') {
            url = `${paths.dashboard.corporateTravel}/${paths.esim.index}/${paths.esim.orders}`;
        }
        if (sessionIccid && planId && sessionIccid !== '{}') {
            url = `${paths.dashboard.corporateTravel}/${paths.esim.index}/${paths.esim.orders}/${paths.esim.details}`;
        }

        // Create the details object
        const details = {
            url,
            service: 'eSim',
            planId,
            iccid: sessionIccid,
        };
        sessionStorage.setItem('ESIM', JSON.stringify(details));
    }, [sessionIccid, planId]);

    // Prefer the iccid passed by the caller; fall back to the session value.
    const displayIccid =
        iccid || (sessionIccid && sessionIccid !== '{}' ? sessionIccid : '');

    // Distinct data sizes / validities surfaced from the (data + validity) plan rows.
    const uniqueData = plans
        ? Array.from(new Set(plans.map(option => String(option.dataGB))))
        : [];
    const uniqueValidity = plans
        ? Array.from(new Set(plans.map(option => getValidity(option))))
        : [];

    // Price is returned per (data, validity) combo by the planTopUp endpoint.
    const getPrice = (data: string, validity: string) => {
        const match = plans?.find(
            option =>
                Number(option.dataGB) === Number(data) &&
                String(getValidity(option)) === String(validity)
        );
        return match?.price;
    };

    const isValidityAvailable = (period: string | number) =>
        !!plans?.some(
            option =>
                Number(option.dataGB) === Number(selectedData) &&
                String(getValidity(option)) === String(period)
        );

    const currency = plans?.[0]?.currency ?? '₹';
    const totalPrice = getPrice(selectedData, selectedValidity);
    const perDay =
        totalPrice != null && Number(selectedValidity) > 0
            ? Number(totalPrice) / Number(selectedValidity)
            : undefined;

    const dataLabel = (value: string) =>
        Number(value) === 0 ? 'Unlimited' : `${value} GB`;

    return (
        <Modal
            title={
                <div>
                    <div className="text-[20px] font-semibold text-[#171717]">Top-up your eSIM</div>
                    {displayIccid && (
                        <div className="text-sm font-normal text-[#475569] mt-1 mb-6">ICCID · {displayIccid}</div>
                    )}
                </div>
            }
            open={isOpen}
            onCancel={handleCancel}
            closeIcon={<CloseOutlined />}
            centered
            width={600}
            styles={{ content: { borderRadius: 24 } }}
            footer={
                <Flex justify="space-between" align="center" className="w-full">
                    <Text className="text-[11px] text-gray-400">Inclusive of all taxes. Activated instantly.</Text>
                    <Flex gap={10}>
                        <Button key="back" danger onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button
                            key="submit"
                            type="primary"
                            danger
                            loading={isLoading}
                            onClick={() => {
                                if (!country) {
                                    console.warn('TopUpModal - Country is missing!', { country });
                                }
                                handleSubmit(selectedData, selectedValidity, country || '');
                                saveDetailsToSession();
                            }}
                        >
                            Top-Up Now
                        </Button>
                    </Flex>
                </Flex>
            }
        >
            {listLoading ? (
                <Skeleton active />
            ) : (
                <Flex vertical gap={24} className="mt-2 mb-2">
                    {/* Section 1 — Choose Data */}
                    <div>
                        <Flex align="center" gap={10} className="mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFF4F4] text-[#FF4F4F] text-xs font-medium">
                                1
                            </span>
                            <Text className="text-[16px] font-semibold text-[#171717]">Choose Data</Text>
                        </Flex>
                        <Row gutter={[12, 12]}>
                            {uniqueData.length
                                ? uniqueData.map(data => {
                                    const isSelected = String(selectedData) === String(data);
                                    return (
                                        <Col xs={12} sm={6} key={data}>
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleDataClick(data)}
                                                onKeyDown={event =>
                                                    handleCardKeyDown(event, () => handleDataClick(data))
                                                }
                                                className={`relative flex flex-col gap-0.5 rounded-xl border px-4 py-2.5 min-h-[60px] cursor-pointer transition ${
                                                    isSelected
                                                        ? 'border-[#FF4F4F] bg-[#FFF4F4]'
                                                        : 'border-[#e9e9ef] hover:border-[#FFCACA]'
                                                }`}
                                            >
                                                <Text className="text-xs text-gray-400">Data</Text>
                                                <Text className="text-[16px] font-semibold text-[#171717]">
                                                    {dataLabel(data)}
                                                </Text>
                                                {isSelected && (
                                                    <Radio checked className="absolute top-2 right-2 m-0" />
                                                )}
                                            </div>
                                        </Col>
                                    );
                                })
                                : 'N/A'}
                        </Row>
                    </div>

                    {/* Section 2 — Choose Validity */}
                    <div>
                        <Flex align="center" gap={10} className="mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFF4F4] text-[#FF4F4F] text-xs font-medium">
                                2
                            </span>
                            <Text className="text-[16px] font-semibold text-[#171717]">Choose Validity</Text>
                        </Flex>
                        <Row gutter={[12, 12]}>
                            {uniqueValidity.length
                                ? uniqueValidity.map(period => {
                                    const isSelected = String(selectedValidity) === String(period);
                                    const isDisabled = !selectedData || !isValidityAvailable(period);
                                    const price = getPrice(selectedData, String(period));
                                    let stateClass = 'border-[#e9e9ef] hover:border-[#FFCACA] cursor-pointer';
                                    if (isDisabled) {
                                        stateClass = 'border-[#e9e9ef] opacity-40 cursor-not-allowed';
                                    } else if (isSelected) {
                                        stateClass = 'border-[#FF4F4F] bg-[#FFF4F4] cursor-pointer';
                                    }
                                    return (
                                        <Col xs={12} sm={6} key={period}>
                                            <div
                                                role="button"
                                                tabIndex={isDisabled ? -1 : 0}
                                                onClick={() =>
                                                    !isDisabled && handleValidityClick(String(period))
                                                }
                                                onKeyDown={event =>
                                                    !isDisabled &&
                                                    handleCardKeyDown(event, () =>
                                                        handleValidityClick(String(period))
                                                    )
                                                }
                                                className={`relative flex flex-col gap-0 rounded-xl border px-4 py-2.5 min-h-[74px] transition ${stateClass}`}
                                            >
                                                <Text className="text-xs text-gray-400">Valid</Text>
                                                <Text className="text-[16px] font-semibold text-[#171717]">
                                                    {period} {Number(period) === 1 ? 'Day' : 'Days'}
                                                </Text>
                                                {price != null && (
                                                    <Text className="text-xs text-gray-400">
                                                        {currency}
                                                        {formatNumberWithLocalStringWithoutDecimalPoint(price, 0, 0)}
                                                    </Text>
                                                )}
                                                {isSelected && (
                                                    <Radio checked className="absolute top-2 right-2 m-0" />
                                                )}
                                            </div>
                                        </Col>
                                    );
                                })
                                : 'N/A'}
                        </Row>
                        <Text className="block text-[11px] text-gray-400 mt-3">
                            Validity starts as soon as the top-up is activated on your eSIM.
                        </Text>
                    </div>

                    {/* Selection summary */}
                    <Flex justify="space-between" align="center" className="rounded-xl bg-[#f7f7f8] p-5">
                        <div>
                            <Text className="block text-xs text-gray-500">Your selection</Text>
                            <Text className="block text-[18px] font-semibold text-[#171717]">
                                {dataLabel(selectedData)} Data
                            </Text>
                            {selectedValidity && perDay != null && (
                                <Text className="block text-sm text-gray-500">
                                    {selectedValidity} {Number(selectedValidity) === 1 ? 'Day' : 'Days'} ·{' '}
                                    {currency}
                                    {formatNumberWithLocalString(perDay, 2, 2)}/day
                                </Text>
                            )}
                        </div>
                        <div className="text-right">
                            <Text className="block text-xs text-gray-500">Total</Text>
                            <Text className="block text-[18px] font-semibold text-[#171717]">
                                {totalPrice != null
                                    ? `${currency}${formatNumberWithLocalStringWithoutDecimalPoint(totalPrice, 0, 0)}`
                                    : '—'}
                            </Text>
                        </div>
                    </Flex>
                </Flex>
            )}
        </Modal>
    );
};

export default TopUpModal;
