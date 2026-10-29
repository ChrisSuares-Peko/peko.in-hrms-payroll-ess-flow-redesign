import { useEffect, useState, type FC } from 'react';

import { ReloadOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Radio, Typography, Button } from 'antd';
import { ReactSVG } from 'react-svg';

import food from '@src/domains/dashboard/Airline/assets/icons/food.svg';
// import { formatNumberWithLocalString } from '@utils/priceFormat';

import '../../../assets/style.css';
import { MealDynamic } from '../../../types/slices';

interface MealsRadioProps {
    index: number;
    meals: MealDynamic[];
    passenger: any;
    setSelectedMeal: (value: any) => void;
}

const MealsRadio: FC<MealsRadioProps> = ({ index, meals, passenger, setSelectedMeal }) => {
    const firstMeal = meals[0];
    const name = `${firstMeal?.Destination} - ${firstMeal?.Origin}`;

    const [value, setValue] = useState<any>();

    useEffect(() => {
        const selected = passenger.MealDynamic.filter((curr: any) => {
            const currName = `${curr.Destination} - ${curr.Origin}`;
            return currName === name;
        });
        if (selected) {
            setValue(selected[0]);
        }
    }, [passenger, name]);

    const handleUpdate = (udpatedValue: any) => {
        setSelectedMeal((prevValue: any) => {
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
        setSelectedMeal((prevValue: any) => {
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
            <Col span={24} className="flex flex-col items-start justify-start mt-2 ms-2">
                <Flex>
                    <ReactSVG src={food} className="" />
                    <Typography.Text className="mx-2 text-lg font-medium leading-7 text-neutral-700">
                        Add a Meal
                    </Typography.Text>
                </Flex>
                <Flex justify="space-between" wrap="wrap" className="w-full" gap={10}>
                    <Typography.Paragraph className="sm:mx-10 text-sm sm:text-base font-normal leading-6 text-neutral-400">
                        Meals are usually cheaper when pre-booked
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
                <Row className="mt-8 w-full" justify="space-between" align="top" gutter={[20, 20]}>
                    {meals.length > 1 || (meals.length === 1 && meals[0].Code !== 'NoMeal') ? (
                        <Radio.Group
                            key={index}
                            value={value}
                            onChange={e => {
                                handleUpdate(e.target.value);
                            }}
                        >
                            {meals.map((meal, mealIndex) => (
                                <Radio.Button
                                    key={mealIndex}
                                    value={meal}
                                    className="custom-radio-button h-20 sm:h-24 mx-2 my-2 text-base font-medium leading-7 capitalize rounded-md text-neutral-400 w-52"
                                >
                                    <Flex
                                        className="p-2"
                                        justify="center"
                                        align="center"
                                        gap={5}
                                        vertical
                                    >
                                        <Flex className="p-0 m-0">
                                            <Typography.Text className="text-sm sm:text-base font-medium capitalize text-black line-clamp-2">
                                                {meal.Code === 'NoMeal'
                                                    ? 'No Meal'
                                                    : meal.AirlineDescription}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="text-neutral-400 ">
                                            ₹ {meal.Price}
                                        </Typography.Text>
                                    </Flex>
                                </Radio.Button>
                            ))}
                        </Radio.Group>
                    ) : (
                        <Flex className="justify-center mt-6 w-full">
                            <Typography.Paragraph className="sm:mx-10 text-sm sm:text-base font-normal leading-6 text-neutral-400">
                                No meal options are currently available
                            </Typography.Paragraph>
                        </Flex>
                    )}
                </Row>
            </Col>
            <Flex vertical className="mt-10">
                {value && (
                    <Flex justify="space-between" className="mb-5 gap-5">
                        <Typography.Text className="text-xs md:text-[1rem] text-nowrap  text-zinc-900 font-semibold">
                            Selected Meal
                        </Typography.Text>
                        <Typography.Text className="text-xs md:text-[1rem]  text-zinc-900 font-semibold me-4 text-end">
                            {value.Code === 'NoMeal' ? 'No Meal' : value.AirlineDescription}
                        </Typography.Text>
                    </Flex>
                )}
                {/* {meals.length > 1 && (
                    <Flex justify="space-between" className="">
                        <Typography.Text className="text-[1rem]  text-zinc-900 font-semibold">
                            Price
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

export default MealsRadio;
