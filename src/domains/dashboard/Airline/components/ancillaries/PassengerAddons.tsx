import { useEffect, useState, type FC } from 'react';

import { Col, Typography, Flex, Button, Divider } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import AncCustomModal from './AncCustomModal';
import BaggagesAddOn from './BaggagesAddon';
import MealsAddOn from './MealsAddon';
import SeatAddOn from './SeatAddOn';
import SelectedAncTags from './SelectedAncTags';
import { ancillariesTypes } from '../../enum/ancillaries';
// import { setPassengerAncillaries } from '../../slices/airlineSlice';
import { SeatResponseType } from '../../types/ancilaryType';
import { Baggage, MealDynamic } from '../../types/slices';
import { isMealBaggageRequired } from '../../utils/ancillaries';

interface PassengerAddonsProps {
    index: number;
    item: any;
    meal: MealDynamic[][] | undefined;
    baggage: Baggage[][] | undefined;
    seat: SeatResponseType[] | undefined;
    isMealRequired: boolean;
    isSeatRequired: boolean;
}

const PassengerAddons: FC<PassengerAddonsProps> = ({
    index,
    item,
    meal,
    baggage,
    seat,
    isMealRequired,
    isSeatRequired,
}) => {
    const { sm } = useScreenSize();

    const { MEAL, SEAT, BAGGAGE } = ancillariesTypes;
    const { Paragraph, Text } = Typography;
    const [isBaggageModalOpen, setIsBaggageModalOpen] = useState(false);
    const [isMealModalOpen, setIsMealModalOpen] = useState(false);
    const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
    const [isMealAndBaggageRequired, setIsMealAndBaggageRequired] = useState(false);

    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );

    useEffect(() => {
        const isRequired = isMealBaggageRequired(selectedAirline, selectedInbountAirline);
        setIsMealAndBaggageRequired(isRequired);
    }, [selectedAirline, selectedInbountAirline]);

   

    return (
        <Col key={index} span={24}>
            <Paragraph className="text-base sm:text-[1.25rem] font-semibold pb-4">
                {`${item.FirstName} ${item.LastName}`}
            </Paragraph>
            {item.PaxType !== 3 && (
                <>
                    {seat && seat.length > 0 && (
                        <Flex vertical>
                            <Flex key={index + 1} className="w-full" justify="space-between">
                                <Paragraph className="text-sm xs375:text-base md:text-lg flex flex-wrap capitalize items-center">
                                    Choose the seat you want
                                    {isSeatRequired ? (
                                        <Text className="text-brandColor mx-1">(Required)</Text>
                                    ) : (
                                        <Text className="text-brandColor mx-1">(Optional)</Text>
                                    )}
                                </Paragraph>
                                <Button
                                    size={sm ? 'middle' : 'small'}
                                    onClick={() => setIsSeatModalOpen(prev => !prev)}
                                    danger
                                >
                                    Select
                                </Button>
                            </Flex>
                            <SelectedAncTags
                                ancType={SEAT}
                                passenger={item}
                                isAncillaryTripWise={false} // always false, not available in api
                            />
                        </Flex>
                    )}
                    <Divider />
                </>
            )}
            {meal && meal.length > 0 && (
                <Flex vertical>
                    <Flex key={index + 2} className="w-full" justify="space-between">
                        <Paragraph className="text-sm xs375:text-base md:text-lg flex flex-wrap capitalize items-center">
                            Add meal
                            {isMealRequired || isMealAndBaggageRequired ? (
                                <Text className="text-brandColor mx-1">(Required)</Text>
                            ) : (
                                <Text className="text-brandColor mx-1">(Optional)</Text>
                            )}
                        </Paragraph>
                        <Button
                            size={sm ? 'middle' : 'small'}
                            onClick={() => setIsMealModalOpen(prev => !prev)}
                            danger
                        >
                            Select
                        </Button>
                    </Flex>
                    <SelectedAncTags ancType={MEAL} passenger={item} isAncillaryTripWise={false} />
                </Flex>
            )}
            {item.PaxType !== 3 && (
                <>
                    <Divider />
                    {baggage && baggage.length > 0 && (
                        <Flex vertical>
                            <Flex key={index + 3} className="w-full" justify="space-between">
                                <Paragraph className="text-sm xs375:text-base md:text-lg flex flex-wrap capitalize items-center">
                                    Add extra luggage
                                    {isMealAndBaggageRequired ? (
                                        <Text className="text-brandColor mx-1">(Required)</Text>
                                    ) : (
                                        <Text className="text-brandColor mx-1">(Optional)</Text>
                                    )}
                                </Paragraph>
                                <Button
                                    size={sm ? 'middle' : 'small'}
                                    onClick={() => setIsBaggageModalOpen(prev => !prev)}
                                    danger
                                >
                                    Select
                                </Button>
                            </Flex>
                            <SelectedAncTags
                                ancType={BAGGAGE}
                                passenger={item}
                                isAncillaryTripWise={false}
                            />
                        </Flex>
                    )}
                </>
            )}

            {/* All modals >>>>>>>>>>>>>>>>>>>>>>>>>>>> */}
            {isSeatModalOpen && seat && (
                <AncCustomModal
                    key={index + 1}
                    handleCancel={() => setIsSeatModalOpen(prev => !prev)}
                    isModalOpen={isSeatModalOpen}
                    customComponents={
                        <SeatAddOn
                            seatDynamic={seat}
                            passenger={item}
                            handleCancel={() => setIsSeatModalOpen(prev => !prev)}
                        />
                    }
                    title="Select Seats"
                />
            )}
            {isMealModalOpen && meal && (
                <AncCustomModal
                    key={index + 2}
                    handleCancel={() => setIsMealModalOpen(prev => !prev)}
                    isModalOpen={isMealModalOpen}
                    customComponents={
                        <MealsAddOn
                            mealDynamic={meal}
                            passenger={item}
                            handleCancel={() => setIsMealModalOpen(prev => !prev)}
                            isMealRequired={isMealRequired}
                        />
                    }
                    title="Select Meals"
                />
            )}
            {isBaggageModalOpen && baggage && (
                <AncCustomModal
                    key={index + 3}
                    handleCancel={() => setIsBaggageModalOpen(prev => !prev)}
                    // handleOk={() => {
                    //     handleSubmit('Baggage');
                    //     setIsBaggageModalOpen(prev => !prev);
                    // }}
                    isModalOpen={isBaggageModalOpen}
                    customComponents={
                        <BaggagesAddOn
                            baggage={baggage}
                            passenger={item}
                            handleCancel={() => setIsBaggageModalOpen(prev => !prev)}
                        />
                    }
                    title="Select Luggage"
                />
            )}
        </Col>
    );
};

export default PassengerAddons;
