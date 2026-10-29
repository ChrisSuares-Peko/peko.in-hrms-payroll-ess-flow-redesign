import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import { ShipmentFormValues } from '../../types';

const { Text } = Typography;

const PackageDetails = () => {
    const { values } = useFormikContext<ShipmentFormValues>();
    const { xs } = useScreenSize();
    const { shipmentType } = useAppSelector(state => state.reducer.logisticsV3);
    const isInternational = shipmentType === 'international';
    return (
        <Flex vertical className="w-full my-5">
            <FieldArray name="items">
                {({ push, remove }) => (
                    <>
                        <Flex className="w-full mb-5" justify="space-between" align="center">
                            <Flex vertical gap={2}>
                                <Text className="text-base font-medium">Item Details</Text>
                                <Text className="text-xs text-gray-400">Add the items inside this box. Pricing is already calculated using the box weight and dimensions selected earlier.</Text>
                            </Flex>
                            <Button
                                danger
                                className="px-6 hidden sm:block"
                                disabled={values.items.length === 10}
                                onClick={() =>
                                    push({
                                        name: '',
                                        price: '',
                                        quantity: '',
                                        hsn: '',
                                    })
                                }
                            >
                                Add Items
                            </Button>
                        </Flex>

                        {values.items.map((_: any, index: number) => (
                            <div key={index}>
                                <Flex className="w-full mb-3" justify="space-between">
                                    <Text className="text-base font-medium">Item {index + 1}</Text>
                                    {values.items.length > 1 && index > 0 && (
                                        <DeleteOutlined
                                            onClick={() => remove(index)}
                                            className="text-lg text-red-500 cursor-pointer"
                                        />
                                    )}
                                </Flex>
                                <Flex vertical={xs} className="w-full">
                                    <div className="w-full sm:w-[40%]">
                                        <TextInput
                                            label="Item Content"
                                            name={`items[${index}].name`}
                                            placeholder="Enter Item Content"
                                            type="text"
                                            isRequired
                                            maxLength={100}
                                        />
                                    </div>

                                    <div className="sm:w-[20%]" />

                                    <div className="w-full sm:w-[40%]">
                                        <TextInput
                                            label="Declared Item Value (₹)"
                                            name={`items[${index}].price`}
                                            placeholder="Enter Package Value"
                                            type="text"
                                            isRequired
                                            maxLength={10}
                                            allowTwoDecimalsOnly
                                        />
                                    </div>
                                </Flex>
                                <div className="w-full sm:w-[40%]">
                                    <TextInput
                                        label="Item Quantity"
                                        name={`items[${index}].quantity`}
                                        placeholder="Enter Item Quantity"
                                        type="text"
                                        isRequired
                                        allowNumbersOnly
                                        maxLength={10}
                                    />
                                </div>
                                {isInternational && (
                                    <div className="w-full sm:w-[40%]">
                                        <TextInput
                                            label="HSN Code"
                                            name={`items[${index}].hsn`}
                                            placeholder="Enter HSN Code"
                                            type="text"
                                            isRequired
                                            allowNumbersOnly
                                            maxLength={8}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button
                            danger
                            className="px-6 mt-5 block sm:hidden"
                            onClick={() =>
                                push({
                                    name: '',
                                    price: '',
                                    quantity: '',
                                    hsn: '',
                                })
                            }
                        >
                            Add Items
                        </Button>
                    </>
                )}
            </FieldArray>
        </Flex>
    );
};

export default PackageDetails;
