import { useEffect, useState } from 'react';

import { Button, Collapse, Flex, Typography } from 'antd';
import { useDispatch } from 'react-redux';

import useScreenSize from '@src/hooks/useScreenSize';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import BaggagesRadio from './BaggagesRadio';
import useFindFlightType from '../../../hooks/useFindFlightType';
import { setPassengerAncillaries } from '../../../slices/airlineSlice';
import { Baggage } from '../../../types/slices';

type Props = {
    baggage: Baggage[][];
    passenger: any;
    handleCancel: () => void;
};

const BaggagesAddOn = ({ baggage, passenger, handleCancel }: Props) => {
    const { sm } = useScreenSize();
    const dispatch = useDispatch();
    const { getFlightType } = useFindFlightType();

    const [selectBaggage, setSelectedBaggage] = useState<any>([]);

    const flightSegmentsData = baggage.map((item, index) => {
        const label = `${item[0].Origin} -> ${item[0].Destination}`;
        const flightType = getFlightType(item[0].Origin, item[0].Destination);
        const isLastSegment = baggage.length === index + 1;

        const i = selectBaggage.findIndex(
            (curr: any) =>
                `${curr.Destination} - ${curr.Origin}` ===
                `${item[0].Destination} - ${item[0].Origin}`
        );

        let price: null | string = null;
        if (i !== -1) {
            price = selectBaggage[i].Price;
        }

        return {
            key: index,
            label: (
                <Flex justify="space-between">
                    <Flex className="gap-3">
                        {flightType && (
                            <Typography.Text className="text-xs xs375:text-sm font-semibold">
                                {flightType}
                            </Typography.Text>
                        )}{' '}
                        <Flex>{label}</Flex>
                    </Flex>
                    {price !== null ? <Flex>₹ {formatNumberWithLocalString(price)}</Flex> : ''}
                </Flex>
            ),
            children: (
                <BaggagesRadio
                    baggages={item}
                    index={index}
                    passenger={passenger}
                    setSelectedBaggage={setSelectedBaggage}
                />
            ),
            style: { borderBottom: !isLastSegment ? '1px solid #ddd' : '' },
        };
    });

    const handleSubmit = () => {
        dispatch(
            setPassengerAncillaries({
                passengerId: passenger.passengerId,
                anc: selectBaggage,
                ancType: 'Baggage',
            })
        );
        handleCancel();
    };

    useEffect(() => {
        setSelectedBaggage(passenger?.Baggage);
    }, [passenger]);

    const price = selectBaggage.reduce((acc: number, value: any) => acc + value.Price, 0);

    return (
        <>
            <Collapse
                defaultActiveKey={['0']}
                expandIconPosition="end"
                ghost
                items={flightSegmentsData}
                size={sm ? 'middle' : 'small'}
            />
            <Flex vertical className="ps-4 pe-8 mt-5">
                <Flex justify="space-between">
                    <Typography.Text className="text-[1rem]  text-zinc-900 font-semibold">
                        Total
                    </Typography.Text>
                    <Typography.Text className="text-[1rem]  text-zinc-900 font-semibold">
                        ₹ {formatNumberWithLocalString(price || 0)}
                    </Typography.Text>
                </Flex>
                <Flex className="w-full mt-5" justify="flex-end" gap={10} key="">
                    <Button
                        key="submit"
                        // type="primary"
                        danger
                        onClick={handleCancel}
                        className="rounded-sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        onClick={handleSubmit}
                        className="rounded-sm"
                    >
                        Submit
                    </Button>
                </Flex>
            </Flex>
        </>
    );
};

export default BaggagesAddOn;
