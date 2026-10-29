import { useEffect, useState, type FC } from 'react';

import { ReloadOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Radio, Typography, Button } from 'antd';

// import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Baggage } from '../../../types/slices';
// import ResetButton from '../ResetButton';

interface BaggagesRadioProps {
    index: number;
    baggages: Baggage[];
    passenger: any;
    setSelectedBaggage: (value: any) => void;
}

const BaggagesRadio: FC<BaggagesRadioProps> = ({
    index,
    baggages,
    passenger,
    setSelectedBaggage,
}) => {
    const firstBaggage = baggages[0];
    const name = `${firstBaggage?.Destination} - ${firstBaggage?.Origin}`;

    const [value, setValue] = useState<any>();

    useEffect(() => {
        const selected = passenger.Baggage.filter((curr: any) => {
            const currName = `${curr.Destination} - ${curr.Origin}`;
            return currName === name;
        });
        if (selected) {
            setValue(selected[0]);
        }
    }, [passenger, name]);

    const handleUpdate = (udpatedValue: any) => {
        setSelectedBaggage((prevValue: any) => {
            const arr = [...prevValue];
            const i = prevValue.findIndex(
                (curr: any) => `${curr.Destination} - ${curr.Origin}` === name
            );
            if (i === -1) {
                arr.push(udpatedValue);
            } else {
                arr[i] = udpatedValue;
            }
            return arr;
        });
        setValue(udpatedValue);
    };

    const [isResetting, setIsResetting] = useState(false);
    const removeAddon = () => {
        setIsResetting(true);
        setSelectedBaggage((prevValue: any) => {
            const arr = [...prevValue];
            const i = prevValue.findIndex(
                (curr: any) => `${curr.Destination} - ${curr.Origin}` === name
            );

            return [...arr.slice(0, i), ...arr.slice(i + 1)];
        });
        setIsResetting(false);
        setValue(null);
    };

    return (
        <>
            <Col span={24} className="mt-2">
                <Flex>
                    <ShoppingOutlined className="w-8 h-8 text-2xl" />
                    <Typography.Text className="mx-2 text-lg font-medium leading-7 text-neutral-700">
                        Add extra Luggage
                    </Typography.Text>
                </Flex>
                <Flex justify="space-between" wrap="wrap" className="w-full" gap={10}>
                    <Typography.Paragraph className="sm:mx-10 text-sm sm:text-base font-normal leading-6 text-neutral-400">
                        Baggage is 20% cheaper when pre-booked.
                    </Typography.Paragraph>
                    <Button
                        danger
                        size="small"
                        onClick={removeAddon}
                        icon={<ReloadOutlined spin={isResetting} />}
                    >
                        Reset
                    </Button>
                </Flex>
                {baggages.length === 1 ? (
                    <Flex className="justify-center mt-6">
                        <Typography.Paragraph className="sm:mx-10 text-sm sm:text-base font-normal leading-6 text-neutral-400">
                            No baggage options are currently available
                        </Typography.Paragraph>
                    </Flex>
                ) : (
                    <Row className="mt-4" gutter={[20, 20]}>
                        <Radio.Group
                            value={value}
                            key={index}
                            onChange={e => {
                                handleUpdate(e.target.value);
                            }}
                        >
                            {baggages.map((baggage, i) => (
                                <Col key={i} className="m-1">
                                    <Flex className="p-3 border justify-between">
                                        <Flex>
                                            <Radio
                                                value={baggage}
                                                key={baggage.Code}
                                                onClick={e => {
                                                    e.preventDefault();
                                                }}
                                            >
                                                <Typography.Text className="sm:mx-2 txt-sm sm:text-base font-medium leading-7 capitalize text-neutral-400 line-clamp-2">
                                                    {baggage.Code === 'NoBaggage'
                                                        ? 'No excess baggage'
                                                        : `Excess Baggage ${baggage.Weight} Kg`}
                                                </Typography.Text>
                                            </Radio>
                                        </Flex>
                                        <Typography.Paragraph className="mx-8 txt-sm sm:text-base font-medium leading-7 capitalize">
                                            ₹ {baggage.Price}
                                        </Typography.Paragraph>
                                    </Flex>
                                </Col>
                            ))}
                        </Radio.Group>
                    </Row>
                )}
            </Col>
            <Flex vertical className="mt-10">
                {value && (
                    <Flex justify="space-between" className="">
                        <Typography.Text className="text-xs md:text-[1rem]  text-zinc-900 font-semibold">
                            Selected Baggage
                        </Typography.Text>
                        <Typography.Text className="text-xs md:text-[1rem]  text-zinc-900 font-semibold me-4">
                            {value.Weight} Kg
                        </Typography.Text>
                    </Flex>
                )}
                {/* {baggages.length > 1 && (
                    <Flex justify="space-between" className="">
                        <Typography.Text className="text-[1rem]  text-zinc-900 font-semibold">
                            Total
                        </Typography.Text>
                        <Typography.Text className="text-[1rem]  text-zinc-900 font-semibold me-4">
                            ₹ {formatNumberWithLocalString(value?.Price || 0)}
                        </Typography.Text>
                    </Flex>
                )} */}
            </Flex>
        </>
    );
};

export default BaggagesRadio;
