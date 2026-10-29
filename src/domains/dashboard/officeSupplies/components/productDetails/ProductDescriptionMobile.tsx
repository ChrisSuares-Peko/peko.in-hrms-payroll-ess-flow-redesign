import type { FC } from 'react';

import { Avatar, Col, Flex, Image, InputNumber, Row, Space, Typography } from 'antd';

import cashBack from '@assets/icons/ExtraCashback.svg';
import saveFlat from '@assets/icons/SaveFlat.svg';

interface ProductDescriptionMobileProps {
    id: number;
    colors?: string[];
    price: string;
    actualPrice: string;
    savePrice?: string;
    cartUpdateQuantity: number;
    handleUpdateQuantity: (newQuantity: number) => void;
}

const ProductDescriptionMobile: FC<ProductDescriptionMobileProps> = ({
    id,
    savePrice,
    price,
    colors,
    actualPrice,
    cartUpdateQuantity,
    handleUpdateQuantity,
}) => {
    const save = (parseFloat(actualPrice) - parseFloat(price)).toFixed(2);

    return (
        <>
            <Row gutter={[10, 10]} style={{ marginTop: '16px' }} className="mb-6 items-center">
                <Col span={24}>
                    <Space size={8} className="flex-row items-center">
                        <Typography.Text delete className="text-textGray text-xl font-roboto">
                            AED {actualPrice}
                        </Typography.Text>
                        <Typography.Text className="text-textBlack font-semibold text-xl">
                            AED {price}
                        </Typography.Text>
                    </Space>
                </Col>

                <Row className="flex gap-2">
                    <Col>
                        <Flex gap={10} align="center">
                            <Image
                                preview={false}
                                src={saveFlat}
                                alt="Save flat icon"
                                className="w-6"
                            />
                            <Typography.Text className="text-textDimGreen font-roboto text-xs">
                                Save AED {save}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col>
                        <Flex gap={10} align="center">
                            <Image
                                preview={false}
                                src={cashBack}
                                alt="Get Extra Cashback"
                                className="w-6"
                            />
                            <Typography.Text className="text-textDimGreen font-roboto text-xs">
                                Get Extra Cashback
                            </Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            </Row>
            <Flex align="center" className="my-2 hidden" gap={10}>
                <Col>
                    <Typography.Text
                        strong
                        className="font-roboto text-gray-400 text-xs font-light"
                    >
                        Select your colour:{' '}
                    </Typography.Text>
                    <Flex gap={5} align="center" className="mt-2">
                        {colors &&
                            colors.map((color, index) => (
                                <Avatar key={index} style={{ backgroundColor: color }} size={25} />
                            ))}
                    </Flex>
                </Col>
                <Col>
                    <InputNumber
                        min={1}
                        max={10}
                        className="rounded-lg"
                        defaultValue={cartUpdateQuantity}
                        onChange={value => handleUpdateQuantity(value!)}
                    />
                </Col>
            </Flex>
            <Row className="mt-2">
                <Typography.Text className="text-textBlack font-inter font-normal text-base">
                    This item will be delivered within 2 to 4 working days with standard delivery
                    charge.
                </Typography.Text>
            </Row>
        </>
    );
};

export default ProductDescriptionMobile;
