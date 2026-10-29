import React from 'react';

import { Descriptions, Flex, Typography } from 'antd';

type Props = {
    orderResponse: string;
    description?: boolean;
};

const GetProducts = ({ orderResponse, description = false }: Props) => {
    if (!orderResponse) {
        return <div>No products available</div>;
    }

    const orderData = JSON.parse(orderResponse);
    const { products } = orderData;

    if (description) {
        const descriptionItems = products.map((product: any, index: number) => ({
            key: `${index + 1}`,
            label: `Product ${index + 1}`,
            children: (
                <Flex key={index} vertical>
                    <Typography.Paragraph className="max-w-96 line-clamp-2 hover:line-clamp-none hover:text-red-500">
                        {`${product.productName} (Quantity:${product.productQuantity})`}
                    </Typography.Paragraph>
                    <Typography.Text>₹ {product.totalPrice}</Typography.Text>
                </Flex>
            ),
        }));

        return (
            <Descriptions
                bordered
                size="middle"
                title="Product Details"
                items={descriptionItems}
                column={1}
            />
        );
    }

    const productLines = products.map((product: any, index: any) => (
        <Flex key={index}>
            <Typography.Paragraph className="max-w-96 line-clamp-1 hover:line-clamp-none hover:text-red-500">{`${index + 1}. ${product.productName} (Quantity:${product.productQuantity})`}</Typography.Paragraph>
        </Flex>
    ));

    return <div>{productLines}</div>;
};

export default GetProducts;
