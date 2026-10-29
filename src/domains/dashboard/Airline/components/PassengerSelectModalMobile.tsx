import React, { useCallback, useState, useEffect } from 'react';

import { Button, Flex, Modal, Radio, Typography } from 'antd';

import { ITripData } from '../types/airlineTypes';

interface ModalProps {
    isModalOpen: boolean;
    handleCancel: () => void;
    tripData: ITripData;
    setTripData: any;
}

const PassengerSelectModal: React.FC<ModalProps> = ({
    isModalOpen,
    handleCancel,
    tripData,
    setTripData,
}) => {
    const [tempTripData, setTempTripData] = useState<any>({ ...tripData });

    useEffect(() => {
        if (isModalOpen) {
            setTempTripData({ ...tripData });
        }
    }, [isModalOpen, tripData]);

    const updateTempTripData = useCallback(
        (key: string, val: number) => {
            if (
                tempTripData.adults + tempTripData.children + tempTripData.infants === 9 &&
                val >= Number(tempTripData[key])
            )
                return;

            if (key === 'infants' && val > tempTripData.adults) {
                return;
            }

            if (key === 'adults' && val === 0) return;

            setTempTripData((prevTempTripData: any) => ({
                ...prevTempTripData,
                [key]: val,
            }));

            // after increasing infants , it should auto decrease while adult count downs
            if (key === 'adults' && val < tempTripData.infants) {
                setTempTripData((prevTempTripData: any) => ({
                    ...prevTempTripData,
                    infants: val,
                }));
            }
        },
        [tempTripData]
    );

    const updateTempTripClass = useCallback((key: string, val: string) => {
        setTempTripData((prevTempTripData: any) => ({
            ...prevTempTripData,
            [key]: val,
        }));
    }, []);

    const handleSubmit = () => {
        setTripData(tempTripData);
        handleCancel();
    };

    const handleClear = () => {
        setTempTripData({ ...tripData });
        handleCancel();
    };

    const maxCountExceeded =
        (tempTripData?.adults || 0) +
            (tempTripData?.children || 0) +
            (tempTripData?.infants || 0) ===
        9;
    return (
        <Modal
            closeIcon={false}
            open={isModalOpen}
            onCancel={handleClear}
            footer={[
                <Flex className="w-full" justify="flex-end" gap={10} key="">
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        onClick={handleSubmit}
                        className="rounded-sm"
                    >
                        Submit
                    </Button>
                    <Button key="cancel" onClick={handleClear} className="rounded-sm">
                        Cancel
                    </Button>
                </Flex>,
            ]}
            width={370}
        >
            {/* Adults Section */}
            <Typography.Text className="px-4 text-base font-semibold ">Travellers</Typography.Text>
            <Flex justify="space-between" className="mt-3">
                <Flex vertical>
                    <Typography.Text className=" font-bold ml-5">Adults</Typography.Text>
                    <Typography.Text className=" text-xs ml-5 w-28">
                        12+ years on travel date
                    </Typography.Text>
                </Flex>
                <Flex className="w-28" justify="space-between" align="flex-start">
                    <Button
                        disabled={tempTripData.adults <= 1}
                        shape="circle"
                        onClick={() =>
                            updateTempTripData(
                                'adults',
                                tempTripData.adults > 1 ? tempTripData.adults - 1 : 0
                            )
                        }
                        className="text-xl flex justify-center items-center font-light text-gray-400 p-0 m-0"
                    >
                        -
                    </Button>

                    <Typography.Text className=" text-sm mt-2">
                        {tempTripData.adults}
                    </Typography.Text>
                    <Button
                        disabled={maxCountExceeded}
                        shape="circle"
                        onClick={() => updateTempTripData('adults', tempTripData.adults + 1)}
                        className="text-xl flex justify-center items-center  font-light text-gray-400"
                    >
                        +
                    </Button>
                </Flex>
            </Flex>

            {/* Children Section */}
            <Flex className="mt-5" justify="space-between">
                <Flex vertical>
                    <Typography.Text className=" font-bold ml-5">Children</Typography.Text>
                    <Typography.Text className=" text-xs ml-5 w-28">
                        2-11 years on travel date
                    </Typography.Text>
                </Flex>
                <Flex className="w-28" justify="space-between" align="flex-start">
                    <Button
                        disabled={tempTripData.children <= 0}
                        shape="circle"
                        onClick={() =>
                            updateTempTripData(
                                'children',
                                tempTripData.children > 0 ? tempTripData.children - 1 : 0
                            )
                        }
                        className="text-xl flex justify-center items-center font-light text-gray-400 p-0 m-0"
                    >
                        -
                    </Button>
                    <Typography.Text className=" text-sm mt-2">
                        {tempTripData.children}
                    </Typography.Text>
                    <Button
                        disabled={maxCountExceeded}
                        shape="circle"
                        onClick={() => updateTempTripData('children', tempTripData.children + 1)}
                        className="text-xl flex justify-center items-center  font-light text-gray-400"
                    >
                        +
                    </Button>
                </Flex>
            </Flex>

            {/* Infants Section */}
            <Flex className="my-5" justify="space-between">
                <Flex vertical>
                    <Typography.Text className=" font-bold ml-5">Infants</Typography.Text>
                    <Typography.Text className=" text-xs w-28 ml-5">
                        Below 2 years on travel date
                    </Typography.Text>
                </Flex>
                <Flex className="w-28" justify="space-between" align="flex-start">
                    <Button
                        disabled={tempTripData.infants <= 0}
                        shape="circle"
                        onClick={() =>
                            updateTempTripData(
                                'infants',
                                tempTripData.infants > 0 ? tempTripData.infants - 1 : 0
                            )
                        }
                        className="text-xl flex justify-center items-center font-light text-gray-400 p-0 m-0"
                    >
                        -
                    </Button>
                    <Typography.Text className=" text-sm mt-2">
                        {tempTripData.infants}
                    </Typography.Text>
                    <Button
                        disabled={tempTripData.infants >= tempTripData.adults || maxCountExceeded}
                        shape="circle"
                        onClick={() => updateTempTripData('infants', tempTripData.infants + 1)}
                        className="text-xl flex justify-center items-center  font-light text-gray-400"
                    >
                        +
                    </Button>
                </Flex>
            </Flex>

            <Typography.Text className="text-base font-semibold  px-4">Class</Typography.Text>
            <Flex className="px-4 mt-3">
                <Radio.Group
                    onChange={e => updateTempTripClass('class', e.target.value)}
                    className="rounded-none"
                    value={tempTripData.class}
                    size="middle"
                >
                    <Flex vertical gap={10}>
                        <Radio className="rounded-none m-1" value={2}>
                            Economy
                        </Radio>
                        <Radio className="rounded-none m-1" value={4}>
                            Business Class
                        </Radio>
                        <Radio className="rounded-none m-1" value={6}>
                            First Class
                        </Radio>
                        <Radio className="rounded-none m-1" value={3}>
                            Premium Economy
                        </Radio>
                    </Flex>
                </Radio.Group>
            </Flex>
        </Modal>
    );
};

export default PassengerSelectModal;
