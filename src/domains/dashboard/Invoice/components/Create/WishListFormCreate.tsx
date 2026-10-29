/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect } from 'react';

import { Flex, Typography } from 'antd';
import { ErrorMessage, useFormikContext } from 'formik';

import CustomTextArea from '../CustomTextArea';

interface Item {
    item: string;
    quantity: number;
    price: number;
    gst: number;
    discount: number;
    amount: number;
}

interface FormValues {
    items: Item[];
}

interface WishListFormProps {
    index: number;
}
const { Text } = Typography;

const WishListFormCreate = ({ index }: WishListFormProps) => {
    const { values, setFieldValue } = useFormikContext<FormValues>();

    if (!values) {
        return null;
    }

    const currentItem = values.items[index];
    const quantity = currentItem.quantity || 0;
    const totalPrice = quantity * currentItem.price;
    const totalGST = totalPrice * (currentItem.gst / 100);
    const totalDiscount = totalPrice * (currentItem.discount / 100);
    const totalValue = (totalPrice + totalGST - totalDiscount).toFixed(2);

    useEffect(() => {
        setFieldValue(`items[${index}].amount`, totalValue);
    }, [totalValue, index, setFieldValue]);

    return (
        <Flex className="w-full">
            <Flex className="w-full flex gap-3 flex-col xl:flex-row">
                <Flex className="flex-col w-full" style={{ flex: '2' }}>
                    <Flex className="w-full" gap={5} align="center">
                        <Text className="text-nowrap xl:hidden " style={{ minWidth: '85px' }}>
                            Title:
                        </Text>
                        <CustomTextArea
                            name={`items[${index}].item`}
                            placeholder="Title"
                            label="Item Description"
                            type="text"
                            isRequired
                            maxLength={200}
                        />
                    </Flex>
                    <ErrorMessage
                        name={`items[${index}].item`}
                        render={msg => <div className="error-message text-red-500">{msg}</div>}
                    />
                </Flex>

                <Flex className="flex-col" style={{ flex: 1 }}>
                    <Flex className="w-full" gap={5} align="center">
                        <Text className="text-nowrap  xl:hidden " style={{ minWidth: '85px' }}>
                            Quantity:
                        </Text>
                        <CustomTextArea
                            name={`items[${index}].quantity`}
                            placeholder="Quantity"
                            label="Qty"
                            type="text"
                            allowNumbersOnly
                            maxLength={10}
                            isRequired
                        />
                    </Flex>
                    <ErrorMessage
                        name={`items[${index}].quantity`}
                        render={msg => <div className="error-message text-red-500">{msg}</div>}
                    />
                </Flex>

                <Flex className="flex-col" style={{ flex: '1' }}>
                    <Flex className="w-full" gap={5} align="center">
                        <Text className="text-nowrap  xl:hidden " style={{ minWidth: '85px' }}>
                            Price:
                        </Text>
                        <CustomTextArea
                            name={`items[${index}].price`}
                            placeholder="Price"
                            label="Price"
                            type="text"
                            allowTwoDecimalsOnly
                            maxLength={10}
                            isRequired
                        />
                    </Flex>
                    <ErrorMessage
                        name={`items[${index}].price`}
                        render={msg => <div className="error-message text-red-500">{msg}</div>}
                    />
                </Flex>

                <Flex className="flex-col" style={{ flex: '1' }}>
                    <Flex className="w-full" gap={5} align="center">
                        <Text className="text-nowrap  xl:hidden " style={{ minWidth: '85px' }}>
                            GST (%):
                        </Text>
                        <CustomTextArea
                            name={`items[${index}].gst`}
                            placeholder="GST  "
                            label="GST (%)"
                            type="text"
                            maxLength={5}
                            allowTwoDecimalsOnly
                        />
                    </Flex>
                    <ErrorMessage
                        name={`items[${index}].gst`}
                        render={msg => <div className="error-message text-red-500">{msg}</div>}
                    />
                </Flex>

                <Flex className="flex-col" style={{ flex: '1' }}>
                    <Flex className="w-full" gap={5} align="center">
                        <Text className="text-nowrap  xl:hidden" style={{ minWidth: '85px' }}>
                            Discount (%):
                        </Text>
                        <CustomTextArea
                            name={`items[${index}].discount`}
                            placeholder="Discount"
                            label="Discount (%)"
                            type="text"
                            maxLength={5}
                            allowTwoDecimalsOnly
                        />
                    </Flex>
                    <ErrorMessage
                        name={`items[${index}].discount`}
                        render={msg => <div className="error-message text-red-500">{msg}</div>}
                    />
                </Flex>

                <Flex className="flex-col" style={{ flex: '1' }}>
                    <Flex className="w-full" gap={5} align="center">
                        <Text className="text-nowrap  xl:hidden " style={{ minWidth: '85px' }}>
                            Total:
                        </Text>
                        <CustomTextArea
                            name={`items[${index}].amount`}
                            placeholder=""
                            label="Total"
                            type="text"
                            isDisabled
                            allowNumbersOnly
                        />
                    </Flex>
                    <ErrorMessage
                        name={`items[${index}].amount`}
                        render={msg => <div className="error-message text-red-500">{msg}</div>}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};

export default WishListFormCreate;
