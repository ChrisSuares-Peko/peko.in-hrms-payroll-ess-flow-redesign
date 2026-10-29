import { useEffect, useState } from 'react';

import { ArrowRightOutlined, CheckCircleFilled, CloseOutlined, InfoCircleOutlined, MinusCircleFilled } from '@ant-design/icons';
import { Button, Divider, Flex, Modal, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Flight } from '../types/Flight';
import { retrieveAirlineName } from '../utils/airlineData';

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: (selected: Flight) => void;
    fareVariants: Flight[];
    origin: string;
    destination: string;
};

// function getFareDescription(fareType?: string): string {
//     if (!fareType) return '';
//     const key = fareType
//         .toUpperCase()
//         .replace(/[()]/g, '')
//         .replace(/\s+/g, '_')
//         .replace(/-/g, '_')
//         .replace(/_+/g, '_')
//         .replace(/^_|_$/g, '');
//     return FARE_DESCRIPTIONS[key] || '';
// }

function getCheapestCancellationFee(miniFareRules?: any[]): string | null {
    if (!miniFareRules || miniFareRules.length === 0) return null;
    const cancellations = miniFareRules.filter((r: any) => r.Type === 'Cancellation');
    if (cancellations.length === 0) return null;
    const sorted = [...cancellations].sort((a: any, b: any) => Number(b.From) - Number(a.From));
    return sorted[0]?.Details || null;
}

const FareSelectionModal = ({ open, onClose, onConfirm, fareVariants, origin, destination }: Props) => {
    const [selectedFare, setSelectedFare] = useState<Flight | null>(fareVariants[0] ?? null);

    useEffect(() => {
        const stillValid = fareVariants.some(f => f.ResultIndex === selectedFare?.ResultIndex);
        if (!stillValid) setSelectedFare(fareVariants[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fareVariants]);

    const airlineName = fareVariants[0]
        ? retrieveAirlineName(fareVariants[0].flightCode)
        : '';
    const flightNumber = fareVariants[0]?.flightNumber || '';
    const flightCode = fareVariants[0]?.flightCode || '';

    if (!selectedFare) return null;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            centered
            width="min(960px, 95vw)"
            title={null}
            closable={false}
            footer={null}
            styles={{
                content: { borderRadius: 16, overflow: 'hidden', padding: 0 },
                body: { padding: 0 },
            }}
        >
            {/* Header */}
            <Flex
                justify="space-between"
                align="flex-start"
                className="px-7 py-5 border-b border-gray-100"
            >
                <div>
                    <Typography.Text className="block text-[17px] font-semibold text-gray-900 leading-snug">
                        Choose your fare
                    </Typography.Text>
                    <Typography.Text className="text-[13px] text-gray-400 capitalize mt-0.5">
                        {airlineName} · {flightCode} {flightNumber} · {origin} → {destination}
                    </Typography.Text>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors mt-0.5 border-0 bg-transparent cursor-pointer"
                >
                    <CloseOutlined style={{ fontSize: 14 }} />
                </button>
            </Flex>

            {/* Fare cards */}
            <div className="px-7 py-5 overflow-x-auto">
                <Flex className="gap-3" align="stretch" style={{ width: 'fit-content', margin: '0 auto' }}>
                    {fareVariants.map((flight, idx) => {
                        const isSelected = selectedFare.ResultIndex === flight.ResultIndex;
                        const fareLabel =
                            flight.FareClassification?.Type ||
                            flight.fareType ||
                            'Standard';
                        // const description = getFareDescription(fareLabel);
                        const cancelFee = getCheapestCancellationFee(flight.miniFareRules);
                        const cabinBaggage = flight.journey?.[0]?.[0]?.CabinBaggage || '';
                        const checkedBaggage = flight.baggageAllowance
                            ? String(flight.baggageAllowance).trim().replace(/\s+/g, ' ').replace(/\s+$/, '')
                            : '';

                        return (
                            <div
                                key={idx}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedFare(flight)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') setSelectedFare(flight);
                                }}
                                className={`relative w-[240px] flex-shrink-0 rounded-[10px] cursor-pointer transition-all p-4 flex flex-col ${
                                    isSelected
                                        ? 'border border-red-500 bg-rose-50'
                                        : 'border border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                {/* Fare name + radio */}
                                <Flex justify="space-between" align="flex-start" className="gap-2">
                                    <div className="flex-1 min-w-0">
                                        <Typography.Text
                                            className="block font-semibold text-[14px] text-gray-900 capitalize leading-snug truncate"
                                            title={fareLabel}
                                        >
                                            {fareLabel}
                                        </Typography.Text>
                                        {/* {description && (
                                            <Typography.Text className="block text-[11px] text-gray-400 mt-0.5 leading-snug">
                                                {description}
                                            </Typography.Text>
                                        )} */}
                                    </div>
                                    {/* Radio indicator */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {isSelected ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center">
                                                <div className="w-[7px] h-[7px] rounded-full bg-red-500" />
                                            </div>
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                        )}
                                    </div>
                                </Flex>

                                {/* Price */}
                                <div className="mt-3">
                                    <Typography.Text className="text-[16px] font-bold text-gray-900 leading-tight">
                                        ₹ {formatNumberWithLocalString(flight.price)}
                                    </Typography.Text>
                                </div>

                                <Divider className="my-3" style={{ margin: '12px 0' }} />

                                {/* Perks */}
                                <Flex vertical gap={7} className="flex-1">
                                    {cabinBaggage && (
                                        <Typography.Text
                                            className="text-[12px] text-gray-600 block"
                                            style={{ paddingLeft: 20, textIndent: -20 }}
                                        >
                                            <CheckCircleFilled className="text-green-500 me-[7px]" style={{ fontSize: 13 }} />
                                            {cabinBaggage} cabin baggage
                                        </Typography.Text>
                                    )}
                                    {checkedBaggage && (
                                        <Typography.Text
                                            className="text-[12px] text-gray-600 block"
                                            style={{ paddingLeft: 20, textIndent: -20 }}
                                        >
                                            <CheckCircleFilled className="text-green-500 me-[7px]" style={{ fontSize: 13 }} />
                                            {checkedBaggage} checked baggage
                                        </Typography.Text>
                                    )}
                                    {(flight.fareInclusions || []).map((inclusion, i) => {
                                        const [category, detail] = inclusion.split(' - ');
                                        const isChargeable = detail?.toLowerCase().includes('chargeable');
                                        return (
                                            <Typography.Text
                                                key={i}
                                                className={`text-[12px] block ${isChargeable ? 'text-gray-400' : 'text-gray-600'}`}
                                                style={{ paddingLeft: 20, textIndent: -20 }}
                                            >
                                                {isChargeable ? (
                                                    <MinusCircleFilled className="text-gray-300 me-[7px]" style={{ fontSize: 13 }} />
                                                ) : (
                                                    <CheckCircleFilled className="text-green-500 me-[7px]" style={{ fontSize: 13 }} />
                                                )}
                                                {category}{detail ? `: ${detail}` : ''}
                                            </Typography.Text>
                                        );
                                    })}
                                    {flight.isRefundable && (
                                        <Typography.Text
                                            className="text-[12px] text-gray-600 block"
                                            style={{ paddingLeft: 20, textIndent: -20 }}
                                        >
                                            <CheckCircleFilled className="text-green-500 me-[7px]" style={{ fontSize: 13 }} />
                                            Refundable
                                        </Typography.Text>
                                    )}
                                    {cancelFee && (
                                        <Typography.Text
                                            className="text-[12px] text-gray-600 block"
                                            style={{ paddingLeft: 20, textIndent: -20 }}
                                        >
                                            <CheckCircleFilled className="text-green-500 me-[7px]" style={{ fontSize: 13 }} />
                                            Cancel from {cancelFee}
                                        </Typography.Text>
                                    )}
                                    {flight.isGSTMandatory && (
                                        <Typography.Text
                                            className="text-[12px] text-gray-400 block"
                                            style={{ paddingLeft: 20, textIndent: -20 }}
                                        >
                                            <InfoCircleOutlined className="text-gray-400 me-[7px]" style={{ fontSize: 13 }} />
                                            GST details required
                                        </Typography.Text>
                                    )}
                                </Flex>
                            </div>
                        );
                    })}
                </Flex>
            </div>

            {/* Footer */}
            <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                className="px-7 py-4 border-t border-gray-100 gap-3"
            >
                <div>
                    <Typography.Text className="block text-[11px] text-gray-400 tracking-wide">
                        Total amount
                    </Typography.Text>
                    <Typography.Text className="text-[18px] font-bold text-gray-900 leading-tight">
                        ₹ {formatNumberWithLocalString(selectedFare.price)}
                    </Typography.Text>
                </div>
                <Flex vertical align="flex-end" gap={6}>
                    <Flex gap={10} wrap="wrap" justify="flex-end">
                        <Button onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            danger
                            type="primary"
                            onClick={() => onConfirm(selectedFare)}
                        >
                            Continue to book <ArrowRightOutlined />
                        </Button>
                    </Flex>
                    {selectedFare.isGSTMandatory && (
                        <Typography.Text className="text-[11px] text-gray-400">
                            <InfoCircleOutlined className="me-[6px]" style={{ fontSize: 12 }} />
                            This fare requires GST details at booking
                        </Typography.Text>
                    )}
                </Flex>
            </Flex>
        </Modal>
    );
};

export default FareSelectionModal;
