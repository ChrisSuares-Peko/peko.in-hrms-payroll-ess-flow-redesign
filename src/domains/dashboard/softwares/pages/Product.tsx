import { Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { Price, ProductDetails } from '../components/product';
import ProductContextProvider from '../contexts/ProductContext';

const Product = () => (
    <ProductContextProvider>
        <Content className="my-6">
            <Flex className="w-full gap-3 flex-col xl:flex-row justify-between">
                <ProductDetails />
                <Price />
            </Flex>
        </Content>
    </ProductContextProvider>
);

export default Product;
