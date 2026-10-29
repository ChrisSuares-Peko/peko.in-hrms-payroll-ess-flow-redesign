import React from 'react';

import { Button, Checkbox, Flex, Typography } from 'antd';

import CloudIcon from '../../assets/svg/cloud.svg';
import { DomainResult } from '../../types/index';

const { Text } = Typography;

interface Props {
    domain: DomainResult;
    inCart: boolean;
    isSelected: boolean;
    addingId: string | null;
    updatingId: string | null;
    onAdd: (domain: DomainResult) => void;
    onRemove: (domain: DomainResult) => void;
    onToggleSelect: (classkey: string) => void;
}

const DomainResultRow: React.FC<Props> = ({
    domain,
    inCart,
    isSelected,
    addingId,
    updatingId,
    onAdd,
    onRemove,
    onToggleSelect,
}) => {
    const isLoading = addingId === domain.classkey || updatingId === domain.classkey;

    return (
        <div
            className={`rounded-[20px] py-4 px-6 flex items-center justify-between border ${
                isSelected ? 'border border-red-200' : 'border-[0.7px] border-slate-300'
            }`}
        >
            <Flex align="center" gap={20}>
                <Checkbox
                    checked={isSelected}
                    onChange={() => onToggleSelect(domain.domain)}
                />
                <Flex align="center" gap={12}>
                    <div className="bg-red-50 p-3 rounded-full flex items-center justify-center">
                        <img src={CloudIcon} alt="domain" className="w-[18px] h-[17px]" />
                    </div>
                    <Text className="text-slate-800">
                        <Text strong style={{ fontSize: 20 }}>
                            {domain.displayDomain || domain.domain}
                        </Text>{' '}
                        <Text style={{ fontSize: 18 }}>is available</Text>
                    </Text>
                </Flex>
            </Flex>
            <Flex align="center" gap={24}>
                {domain.price != null && (
                    <Text strong style={{ fontSize: 20 }} className="text-slate-800">
                        ₹ {domain.price.toLocaleString('en-IN')}/Year
                        {(domain.registrationYears ?? 1) > 1 && (
                            <Text className="text-slate-500 text-sm font-normal">
                                {' '}({domain.registrationYears}-yr min)
                            </Text>
                        )}
                    </Text>
                )}
                {inCart ? (
                    <Button
                        className="w-[120px] h-[45px] border-slate-300 text-slate-500"
                        loading={isLoading}
                        onClick={() => onRemove(domain)}
                    >
                        Remove
                    </Button>
                ) : (
                    <Button
                        className="w-[120px] h-[45px] border-brandColor text-brandColor"
                        loading={isLoading}
                        onClick={() => onAdd(domain)}
                    >
                        Add to Cart
                    </Button>
                )}
            </Flex>
        </div>
    );
};

export default DomainResultRow;
