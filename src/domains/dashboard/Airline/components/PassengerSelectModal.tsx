import React, { useCallback, useEffect, useState } from 'react';

import { Button, Flex, Modal, Radio, Typography } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import { ITripData } from '../types/airlineTypes';

interface ModalProps {
    isModalOpen: boolean;
    handleCancel: () => void;
    tripData: ITripData;
    setTripData: any;
}

const CounterButton: React.FC<{
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ disabled, onClick, children }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-9 h-9 rounded-full border flex items-center justify-center text-lg font-light transition-colors select-none
            ${disabled
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 cursor-pointer'
            }`}
    >
        {children}
    </button>
);

const PassengerSelectModal: React.FC<ModalProps> = ({
    isModalOpen,
    handleCancel,
    tripData,
    setTripData,
}) => {
    const { md } = useScreenSize();
    const [tempTripData, setTempTripData] = useState<any>({ ...tripData });

    useEffect(() => {
        if (isModalOpen) {
            setTempTripData({ ...tripData });
        }
    }, [isModalOpen, tripData]);

    const updateTripData = useCallback(
        (key: string, val: number) => {
            if (
                tempTripData.adults + tempTripData.children + tempTripData.infants === 9 &&
                val >= Number(tempTripData[key])
            )
                return;

            if (key === 'adults' && val === 0) return;

            setTempTripData((prevTripData: any) => {
                const newValue = {
                    ...prevTripData,
                    [key]: val,
                };
                const { infants } = prevTripData;
                if (infants > newValue.adults) {
                    newValue.infants = newValue.adults;
                }
                return newValue;
            });
        },
        [tempTripData]
    );

    const updateTripClass = useCallback((key: string, val: string) => {
        setTempTripData((prevTripData: object) => ({
            ...prevTripData,
            [key]: val,
        }));
    }, []);

    const handleSubmit = () => {
        setTripData(tempTripData);
        handleCancel();
    };

    const classOptions = [
        { label: 'Economy', value: 2 },
        { label: 'Premium Economy', value: 3 },
        { label: 'Business Class', value: 4 },
        { label: 'First Class', value: 6 },
    ];

    const maxCountExceeded = tempTripData.adults + tempTripData.children + tempTripData.infants >= 9;

    return (
        <Modal
            closeIcon={false}
            open={isModalOpen}
            onCancel={handleCancel}
            footer={[
                <Flex className="w-full mt-6" justify="flex-end" gap={10} key="footer">
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        onClick={handleSubmit}
                        className="h-12 px-8 rounded-lg font-semibold"
                    >
                        Submit
                    </Button>
                    <Button
                        key="cancel"
                        onClick={handleCancel}
                        className="h-12 px-8 rounded-lg border-gray-300 text-gray-700 font-semibold"
                    >
                        Cancel
                    </Button>
                </Flex>,
            ]}
            width={400}
            className="rounded-2xl overflow-hidden pb-0"
            styles={{
                content: {
                    borderRadius: '16px',
                    padding: '24px',
                },
            }}
        >
            <Flex vertical gap={24}>
                <Typography.Text className="text-lg font-bold">Travellers</Typography.Text>

                <Flex vertical gap={20}>
                    {/* Adults Section */}
                    <Flex justify="space-between" align="center">
                        <Flex vertical>
                            <Typography.Text className="font-bold text-base">Adults</Typography.Text>
                            <Typography.Text className="text-xs text-gray-500">
                                12+ years on travel date
                            </Typography.Text>
                        </Flex>
                        <Flex gap={12} align="center">
                            <CounterButton
                                disabled={tempTripData.adults <= 1}
                                onClick={() =>
                                    updateTripData('adults', tempTripData.adults > 1 ? tempTripData.adults - 1 : 0)
                                }
                            >
                                -
                            </CounterButton>
                            <Typography.Text className="text-base font-semibold w-6 text-center">
                                {tempTripData.adults}
                            </Typography.Text>
                            <CounterButton
                                disabled={maxCountExceeded}
                                onClick={() => updateTripData('adults', tempTripData.adults + 1)}
                            >
                                +
                            </CounterButton>
                        </Flex>
                    </Flex>

                    {/* Children Section */}
                    <Flex justify="space-between" align="center">
                        <Flex vertical>
                            <Typography.Text className="font-bold text-base">Children</Typography.Text>
                            <Typography.Text className="text-xs text-gray-500">
                                2-11 years on travel date
                            </Typography.Text>
                        </Flex>
                        <Flex gap={12} align="center">
                            <CounterButton
                                disabled={tempTripData.children <= 0}
                                onClick={() =>
                                    updateTripData('children', tempTripData.children > 0 ? tempTripData.children - 1 : 0)
                                }
                            >
                                -
                            </CounterButton>
                            <Typography.Text className="text-base font-semibold w-6 text-center">
                                {tempTripData.children}
                            </Typography.Text>
                            <CounterButton
                                disabled={maxCountExceeded}
                                onClick={() => updateTripData('children', tempTripData.children + 1)}
                            >
                                +
                            </CounterButton>
                        </Flex>
                    </Flex>

                    {/* Infants Section */}
                    <Flex justify="space-between" align="center">
                        <Flex vertical>
                            <Typography.Text className="font-bold text-base">Infants</Typography.Text>
                            <Typography.Text className="text-xs text-gray-500">
                                Below 2 years on travel date
                            </Typography.Text>
                        </Flex>
                        <Flex gap={12} align="center">
                            <CounterButton
                                disabled={tempTripData.infants <= 0}
                                onClick={() =>
                                    updateTripData('infants', tempTripData.infants > 0 ? tempTripData.infants - 1 : 0)
                                }
                            >
                                -
                            </CounterButton>
                            <Typography.Text className="text-base font-semibold w-6 text-center">
                                {tempTripData.infants}
                            </Typography.Text>
                            <CounterButton
                                disabled={tempTripData.infants >= tempTripData.adults || maxCountExceeded}
                                onClick={() => updateTripData('infants', tempTripData.infants + 1)}
                            >
                                +
                            </CounterButton>
                        </Flex>
                    </Flex>
                </Flex>

                <Flex vertical gap={12}>
                    <Typography.Text className="text-lg font-bold">Class</Typography.Text>
                    <Flex wrap="wrap" gap={10}>
                        {md ? (
                            classOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTripClass('class', option.value as any)}
                                    className={`px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium select-none
                                        ${tempTripData.class === option.value
                                            ? 'border-[#FF4F4F] text-[#FF4F4F] bg-[#FFF4F4]'
                                            : 'border-gray-300 text-gray-700 hover:border-[#FF4F4F] hover:text-[#FF4F4F] bg-white'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <Radio.Group
                                onChange={e => updateTripClass('class', e.target.value)}
                                value={tempTripData.class}
                            >
                                <Flex vertical gap={15}>
                                    {classOptions.map(option => (
                                        <Radio key={option.value} value={option.value}>
                                            {option.label}
                                        </Radio>
                                    ))}
                                </Flex>
                            </Radio.Group>
                        )}
                    </Flex>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default PassengerSelectModal;
