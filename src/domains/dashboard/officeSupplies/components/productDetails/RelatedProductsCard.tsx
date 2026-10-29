import React from 'react';

import { Card, Typography, Flex, Image, Col, Row } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import defaultImage from '../../assets/images/defaultImage.png';
import { ProductCardProps } from '../../types/products';

export interface RelatedProductsCardProps {
    images?: string[];
    description?: string;
    price?: string;
    category?: string;
    savePrice?: string;
    id?: number | undefined;
}

const RelatedProductsCard: React.FC<ProductCardProps> = ({
    image,
    name,
    price,
    category,
    quantity,
    actualPrice,
    id,
}) => {
    const navigate = useNavigate();
    const save = (parseFloat(actualPrice) - parseFloat(price)).toFixed(2);
    const formattedPrice = formatNumberWithLocalString(actualPrice);

    return (
        <Col xs={12} sm={12} md={8} lg={8} xxl={4} className="flex justify-center">
            <Card
                size="small"
                onClick={() =>
                    navigate(
                        `/${paths.officeSupplies.index}/${paths.officeSupplies.productDetails}/${id}`
                    )
                }
                className="xs:w-full pt-2 cursor-pointer p-2 md:py-0 border border-textWhitesmoke rounded-xl"
                cover={
                    <Image
                        alt="Product"
                        preview={false}
                        fallback={defaultImage}
                        src={image}
                        height={200}
                        className="object-contain rounded-3xl px-1 py-2 hover:scale-105"
                    />
                }
            >
                <Flex className="line-clamp-3 mt-2 text-neutral-900 xs:text-xs sm:text-base font-medium">
                    {name}
                </Flex>
                <Flex className=" text-textC1B md:text-black text-sm font-light">{category}</Flex>
                <Row justify="space-between" className="items-center">
                    <Flex className="flex-col mt-2">
                        <Typography.Text className=" font-semibold md:font-bold text-textBlack text-xs  md:text-base">
                            AED {formatNumberWithLocalString(price)}
                        </Typography.Text>
                        {actualPrice !== price && (
                            <Typography.Text
                                delete
                                className="font-medium text-xs md:text-sm text-gray-300"
                            >
                                {formattedPrice}
                            </Typography.Text>
                        )}
                    </Flex>
                    {parseFloat(save) > 0 && (
                        <Typography.Text className="font-semibold text-xs md:text-xm text-textGreen">
                            Save {save}
                        </Typography.Text>
                    )}
                </Row>
            </Card>
        </Col>
    );
};

export default RelatedProductsCard;
