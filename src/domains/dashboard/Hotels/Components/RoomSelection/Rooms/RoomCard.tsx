import { useState } from 'react';

import { CheckCircleFilled, DownOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import AmenitiesList from './AmenitiesList';
import {
    buildAmenityItems,
    CancelPolicy,
    chargeLabel,
    formatPolicyDate,
    formatRoomName,
    getFreeCancellationDeadline,
    priceLabel,
    promotionLabel,
} from './roomFormatters';

interface RoomCardProps {
    room: any;
    optionIndex?: number;
    selected: boolean;
    onSelect: () => void;
}

const RoomCard = ({ room, optionIndex, selected, onSelect }: RoomCardProps) => {
    const [showCancellation, setShowCancellation] = useState(false);

    const subRoomNames: string[] = room.Name ?? [];
    const isCombo = subRoomNames.length > 1;
    const amenityItems = buildAmenityItems(room);
    const promotion = promotionLabel(room.RoomPromotion);
    const cancelPolicies: CancelPolicy[] = room.CancelPolicies ?? [];
    const freeCancellationDeadline = getFreeCancellationDeadline(cancelPolicies);
    const chargePolicies = cancelPolicies.filter(p => Number(p.CancellationCharge) > 0);

    return (
        <Flex
            vertical
            gap={20}
            className={`p-6 rounded-2xl w-[320px] shrink-0 ${
                selected ? 'border-2 border-brandMuted' : 'border border-gray-200'
            }`}
        >
            {isCombo && (
                <Flex justify="space-between" align="center" className="w-full">
                    <Typography.Text className="text-xs font-medium text-slate-500 tracking-wide">
                        OPTION {(optionIndex ?? 0) + 1}
                    </Typography.Text>
                    {promotion && (
                        <span className="bg-emerald-50 text-emerald-500 text-xs font-medium px-2 py-[3px] rounded">
                            {promotion}
                        </span>
                    )}
                </Flex>
            )}

            {!isCombo && promotion && (
                <Flex gap={8} className="w-full">
                    <span className="bg-emerald-50 text-emerald-500 text-xs font-medium px-2 py-[3px] rounded">
                        {promotion}
                    </span>
                    <span className="bg-slate-50 text-slate-600 text-xs font-medium px-2 py-[3px] rounded">
                        Limited Offer
                    </span>
                </Flex>
            )}

            {subRoomNames.map((name, index) => (
                <Flex vertical gap={20} className="w-full" key={index}>
                    <Flex vertical gap={10} className="w-full">
                        <Typography.Text className="text-lg font-semibold text-slate-800">
                            {formatRoomName(name)}
                        </Typography.Text>
                    </Flex>
                    <AmenitiesList items={amenityItems} />
                    {index < subRoomNames.length - 1 && (
                        <div className="border-t border-gray-200 w-full" />
                    )}
                </Flex>
            ))}

            <div className="border-t border-gray-200 w-full" />

            <Flex vertical gap={14} className="bg-slate-50 rounded-lg p-3.5 w-full">
                <Flex
                    justify="space-between"
                    align="center"
                    className="cursor-pointer w-full"
                    onClick={() => setShowCancellation(v => !v)}
                >
                    <Typography.Text className="text-sm font-medium text-slate-800">
                        Cancellation Policy
                    </Typography.Text>
                    <DownOutlined
                        className="text-xs transition-transform"
                        style={{ transform: showCancellation ? 'rotate(180deg)' : 'none' }}
                    />
                </Flex>
                {showCancellation && (
                    <Flex vertical gap={10} className="w-full">
                        {cancelPolicies.length === 0 && (
                            <Typography.Text className="text-[13px] text-slate-600">
                                Cancellation policy details are not available at this time.
                            </Typography.Text>
                        )}
                        {freeCancellationDeadline && (
                            <Flex gap={4} align="center">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                <Typography.Text className="text-[13px] text-green-500">
                                    Free cancellation until{' '}
                                    {formatPolicyDate(freeCancellationDeadline)}
                                </Typography.Text>
                            </Flex>
                        )}
                        {chargePolicies.map((policy, index) => (
                            <Typography.Text key={index} className="text-[13px] text-slate-600">
                                From {formatPolicyDate(policy.FromDate)}: {chargeLabel(policy)}{' '}
                                charge
                            </Typography.Text>
                        ))}
                        <Typography.Text className="text-[13px] text-slate-600">
                            Refundable:{' '}
                            <span className="font-semibold text-slate-800">
                                {room.IsRefundable ? 'Yes' : 'No'}
                            </span>
                        </Typography.Text>
                    </Flex>
                )}
            </Flex>

            <Flex vertical gap={4} className="w-full mt-auto">
                <Flex gap={6} align="center">
                    <Typography.Text className="text-xl font-extrabold text-slate-800">
                        ₹ {formatNumberWithLocalString(room.TotalFare)}
                    </Typography.Text>
                    <Typography.Text className="text-sm text-slate-500">
                        {priceLabel(room)}
                    </Typography.Text>
                </Flex>
                <Typography.Text className="text-sm text-slate-600 opacity-80">
                    Includes ₹ {formatNumberWithLocalString(room.TotalTax)} taxes & fees
                </Typography.Text>
            </Flex>

            {selected ? (
                <Flex
                    align="center"
                    justify="center"
                    gap={8}
                    className="bg-slate-50 rounded-lg h-10 w-full"
                >
                    <CheckCircleFilled className="text-green-500" />
                    <Typography.Text className="text-sm font-medium text-slate-600">
                        Selected
                    </Typography.Text>
                </Flex>
            ) : (
                <button
                    type="button"
                    onClick={onSelect}
                    className="bg-brandPrimary hover:bg-brandPrimary/90 rounded-lg h-10 w-full text-sm font-medium text-white"
                >
                    Select Room
                </button>
            )}
        </Flex>
    );
};

export default RoomCard;
