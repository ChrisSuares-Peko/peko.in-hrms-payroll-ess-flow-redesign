import type { FC } from 'react';

import { Flex, Image, Table, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ReturnSection from './ReturnSection';
import defaultImage from '../../assets/images/defaultImage.png';
import { OrderedProduct } from '../../types/orderHistory';

interface ProductListingLGProps {
    getOrderDetails: any;
}

const ProductListingLG: FC<ProductListingLGProps> = ({ getOrderDetails }) => {
    const orderedProducts = useAppSelector(state => state.reducer.orderDetails.orderedProducts);

    const columns = [
        {
            title: 'Product',
            key: 'product',
            width: '70%',
            render: (_: any, record: OrderedProduct) => (
                <Flex gap={20}>
                    <Image
                        src={record.image}
                        alt="Product"
                        style={{ minWidth: 60, minHeight: 60 }}
                        width={60}
                        height={60}
                        className="object-cover "
                        fallback={defaultImage}
                    />
                    <Flex gap={10} vertical>
                        <Link
                            to={`/${paths.officeSupplies.index}/${paths.officeSupplies.productDetails}/${record.productId}`}
                        >
                            <Typography.Text className=" text-gray-900 font-medium ">
                                {record?.productName}
                            </Typography.Text>
                        </Link>
                        <ReturnSection product={record} getOrderDetails={getOrderDetails} />
                    </Flex>
                </Flex>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: '10%',
            render: (_: any, record: OrderedProduct) => {
                const { totalPrice, productQuantity } = record;
                const price = totalPrice / productQuantity;
                return `AED ${formatNumberWithLocalString(Number(price))}`;
            },
        },
        {
            title: 'Quantity',
            dataIndex: 'productQuantity',
            key: 'productQuantity',
            width: '10%',
        },
        {
            title: 'Total',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: '10%',
            render: (_: any, record: OrderedProduct) => {
                const { totalPrice } = record;
                return `AED ${formatNumberWithLocalString(Number(totalPrice))}`;
            },
        },
    ];
    return (
        <Flex vertical>
            <Table
                dataSource={orderedProducts.map(item => ({
                    ...item,
                    key: item?.productId.toString(),
                }))}
                className="mt-8 font-roboto text-gray-700"
                columns={columns}
                pagination={false}
            />
        </Flex>
    );
};

export default ProductListingLG;
